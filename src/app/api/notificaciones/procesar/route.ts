// ============================================================
// src/app/api/notificaciones/procesar/route.ts — H5 (post fase 30)
//
// Este endpoint es el que finalmente conecta lo que ya existía
// (tabla `notificaciones`, dispatch(), EmailProvider/WhatsAppProvider)
// con un envío real. Antes nadie llamaba dispatch() — este route
// handler es quien lo hace, corriendo periódicamente.
//
// Arquitectura elegida: llamada directa server-side vía cron
// (no Edge Function de Supabase) porque el proyecto ya es 100%
// Next.js/Vercel — evita mantener un runtime Deno aparte. Dos
// formas de programarlo (elige una, están documentadas en
// RUNBOOK.md):
//   A) Vercel Cron (recomendado si el hosting es Vercel): agrega
//      un cron en vercel.json que pegue a esta ruta cada 5-15 min.
//   B) pg_cron + pg_net en Supabase: un job programado en Postgres
//      que hace un POST HTTP a esta ruta con el mismo intervalo.
//
// Seguridad: protegido con un secreto compartido (CRON_SECRET) en
// el header Authorization — sin este endpoint sería público y
// cualquiera podría disparar envíos de WhatsApp/email a costa tuya.
//
// Usa el cliente de service role (bypassa RLS) porque quien llama
// es el cron, no un usuario con sesión — ver
// src/lib/supabase/service-role.ts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { dispatch } from '@/lib/notifications/dispatcher'
import type { CanalNotificacion, Cita, Cliente, TipoNotificacion } from '@/types'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Vercel Cron llama por GET y agrega automáticamente el header
// `Authorization: Bearer $CRON_SECRET` cuando existe esa variable
// de entorno (ver https://vercel.com/docs/cron-jobs). pg_cron +
// pg_net (opción B en RUNBOOK.md) puede llamar por POST con el
// mismo header a mano. Ambos verbos hacen lo mismo.
export async function GET(req: NextRequest) {
  return procesarNotificacionesPendientes(req)
}

interface NotificacionPendienteRow {
  id: string
  cliente_id: string
  cita_id: string | null
  tipo: TipoNotificacion
  canal: CanalNotificacion
  destinatario: 'cliente' | 'admin'
  fecha_programada: string
  clientes: Cliente | null
  citas: Cita | null
}

// Tope por corrida para no saturar el cron ni las APIs externas
// si se acumula un backlog grande.
const LOTE_MAXIMO = 50

export async function POST(req: NextRequest) {
  return procesarNotificacionesPendientes(req)
}

async function procesarNotificacionesPendientes(req: NextRequest) {
  const secretoEsperado = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')

  if (!secretoEsperado) {
    logger.error('[procesar-notificaciones] CRON_SECRET no configurado — endpoint deshabilitado por seguridad.')
    return NextResponse.json({ error: 'Endpoint no configurado.' }, { status: 503 })
  }

  if (auth !== `Bearer ${secretoEsperado}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  const { data: pendientes, error } = await supabase
    .from('notificaciones')
    .select('id, cliente_id, cita_id, tipo, canal, destinatario, fecha_programada, clientes:cliente_id(*), citas:cita_id(*)')
    .eq('enviado', false)
    .lte('fecha_programada', new Date().toISOString())
    .order('fecha_programada', { ascending: true })
    .limit(LOTE_MAXIMO)

  if (error) {
    logger.error('[procesar-notificaciones] Error al leer notificaciones pendientes:', error.message)
    return NextResponse.json({ error: 'Error al leer notificaciones pendientes.' }, { status: 500 })
  }

  const filas = (pendientes ?? []) as unknown as NotificacionPendienteRow[]

  let enviadas = 0
  let fallidas = 0

  for (const fila of filas) {
    if (!fila.clientes) {
      logger.warn('[procesar-notificaciones] Notificación sin cliente asociado, se omite:', fila.id)
      fallidas++
      continue
    }

    // Si es para el admin, el mensaje sigue usando los datos del
    // cliente/cita (para dar contexto), pero se ENVÍA al contacto
    // del admin, configurado por variables de entorno.
    const contacto = fila.destinatario === 'admin'
      ? { email: process.env.ADMIN_EMAIL, telefono: process.env.ADMIN_WHATSAPP_PHONE }
      : undefined

    if (fila.destinatario === 'admin' && !contacto?.email && !contacto?.telefono) {
      logger.warn('[procesar-notificaciones] ADMIN_EMAIL/ADMIN_WHATSAPP_PHONE no configurados — se omite notificación al admin:', fila.id, fila.tipo)
      fallidas++
      continue
    }

    const ok = await dispatch(fila.tipo, fila.clientes, fila.citas ?? undefined, fila.canal, contacto)

    if (ok) {
      const { error: errorUpdate } = await supabase
        .from('notificaciones')
        .update({ enviado: true })
        .eq('id', fila.id)

      if (errorUpdate) {
        // Se envió pero no se pudo marcar — mejor esto que perder
        // de vista el error (QA M3: antes esto se ignoraba en silencio).
        logger.error('[procesar-notificaciones] Enviada pero no se pudo marcar enviado=true:', fila.id, errorUpdate.message)
      }
      enviadas++
    } else {
      // Se deja enviado=false a propósito: la próxima corrida del
      // cron reintenta. Si falla muchas veces seguidas, queda
      // visible en los logs (logger.error dentro de dispatch()).
      fallidas++
    }
  }

  return NextResponse.json({ ok: true, procesadas: filas.length, enviadas, fallidas })
}
