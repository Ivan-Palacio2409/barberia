// ============================================================
// src/app/api/notificaciones/resumen-diario/route.ts
//
// Cron que envía al admin (por email y WhatsApp) el listado de
// citas del día. Corre DOS veces al día (dos entradas en
// vercel.json apuntando a esta misma ruta):
//
//   A) Sin query param — "corrida de la noche": envía las citas
//      de MAÑANA. Pensada para ~8:00 p.m. hora Colombia.
//   B) ?momento=hoy — "corrida de la mañana": envía las citas de
//      HOY. Pensada para ~7:00 a.m. hora Colombia.
//
// A diferencia del resto de notificaciones, esta NO pasa por la
// tabla `notificaciones` (no es "por cliente"): se calcula y se
// envía directo en cada corrida, ya que agrupa TODAS las citas
// del día en un solo mensaje.
//
// Programar con Vercel Cron en vercel.json, ej.:
//   { "path": "/api/notificaciones/resumen-diario", "schedule": "0 1 * * *" }
//   { "path": "/api/notificaciones/resumen-diario?momento=hoy", "schedule": "0 12 * * *" }
// (Colombia es UTC-5 todo el año: 01:00 UTC = 8:00 p.m. del día
// anterior, 12:00 UTC = 7:00 a.m.)
//
// Seguridad: mismo CRON_SECRET que /api/notificaciones/procesar.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { dispatch } from '@/lib/notifications/dispatcher'
import type { ResumenCitaAdmin } from '@/lib/notifications/index'
import type { Cliente } from '@/types'
import { logger } from '@/lib/logger'
import { hoyDate } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return enviarResumenDiario(req)
}

export async function POST(req: NextRequest) {
  return enviarResumenDiario(req)
}

interface CitaManana {
  hora_inicio: string
  clientes: { nombre: string }[] | { nombre: string } | null
  cita_servicios: { servicios: { nombre: string }[] | { nombre: string } | null }[]
}

function nombreServicios(cs: CitaManana['cita_servicios']): string {
  return cs
    .map((c) => {
      const s = c.servicios
      if (!s) return null
      return Array.isArray(s) ? s[0]?.nombre : s.nombre
    })
    .filter(Boolean)
    .join(', ')
}

function nombreCliente(c: CitaManana['clientes']): string {
  if (!c) return 'Cliente'
  return Array.isArray(c) ? (c[0]?.nombre ?? 'Cliente') : c.nombre
}

async function enviarResumenDiario(req: NextRequest) {
  const secretoEsperado = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')

  if (!secretoEsperado) {
    logger.error('[resumen-diario] CRON_SECRET no configurado — endpoint deshabilitado por seguridad.')
    return NextResponse.json({ error: 'Endpoint no configurado.' }, { status: 503 })
  }
  if (auth !== `Bearer ${secretoEsperado}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const adminWhatsapp = process.env.ADMIN_WHATSAPP_PHONE
  if (!adminEmail && !adminWhatsapp) {
    logger.warn('[resumen-diario] ADMIN_EMAIL/ADMIN_WHATSAPP_PHONE no configurados — no se envía el resumen.')
    return NextResponse.json({ ok: true, enviado: false, motivo: 'admin sin contacto configurado' })
  }

  // ?momento=hoy → corrida de la mañana (citas de HOY, offset 0).
  // Sin query param → corrida de la noche (citas de MAÑANA, offset 1).
  const esHoy = new URL(req.url).searchParams.get('momento') === 'hoy'

  const supabase = createServiceRoleClient()

  const dia = hoyDate()
  dia.setDate(dia.getDate() + (esHoy ? 0 : 1))
  const diaStr = dia.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('citas')
    .select(`
      hora_inicio,
      clientes ( nombre ),
      cita_servicios ( servicios ( nombre ) )
    `)
    .eq('fecha', diaStr)
    .in('estado', ['pendiente', 'confirmada'])
    .order('hora_inicio', { ascending: true })

  if (error) {
    logger.error('[resumen-diario] Error consultando citas del día:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resumenCitas: ResumenCitaAdmin[] = ((data ?? []) as unknown as CitaManana[]).map((c) => ({
    hora_inicio: c.hora_inicio,
    cliente_nombre: nombreCliente(c.clientes),
    servicios: nombreServicios(c.cita_servicios) || 'Sin servicios',
  }))

  // "cliente" ficticio solo para satisfacer la forma de NotificationPayload;
  // el envío real va a `contacto` (admin), no a este objeto.
  const clienteFicticio: Cliente = { id: 'admin', nombre: 'Admin' } as Cliente

  const ok = await dispatch(
    'resumen_diario_admin',
    clienteFicticio,
    undefined,
    'whatsapp',
    { email: adminEmail, telefono: adminWhatsapp },
    resumenCitas,
    esHoy,
  )

  return NextResponse.json({ ok: true, enviado: ok, momento: esHoy ? 'hoy' : 'mañana', citas: resumenCitas.length })
}