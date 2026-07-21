// ============================================================
// src/app/api/push/send/route.ts — Fase 30
// Endpoint server-side para enviar una notificacion push a
// todas las suscripciones activas de un cliente.
// Requiere web-push instalado: npm i web-push @types/web-push
// ============================================================
//
// IMPORTANTE: Este endpoint usa la libreria `web-push`.
// Para activarlo en produccion:
//   1. npm install web-push @types/web-push
//   2. Configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
//      y VAPID_SUBJECT en las variables de entorno.
//   3. Descomentar el bloque de envio real abajo.
//
// Por ahora retorna 200 con { ok: true, enviadas: 0 } para que
// el proyecto compile sin la dependencia opcional.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Solo admin puede usar este endpoint
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'administrador') {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 })
    }

    const { cliente_id, title, body, url } = await req.json()

    if (!cliente_id || !title || !body) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    // Obtener suscripciones del cliente
    const { data: suscripciones, error: errSubs } = await supabase
      .from('push_suscripciones')
      .select('endpoint, p256dh, auth')
      .eq('cliente_id', cliente_id)

    if (errSubs || !suscripciones || suscripciones.length === 0) {
      return NextResponse.json({ ok: true, enviadas: 0, mensaje: 'Sin suscripciones activas.' })
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? '/cliente/mis-citas',
      tag: 'barberia-admin',
    })

    // ── Envio real (requiere web-push instalado) ──────────────
    // Descomentar cuando se instale la dependencia:
    //
    // const webpush = await import('web-push')
    // webpush.setVapidDetails(
    //   process.env.VAPID_SUBJECT!,
    //   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    //   process.env.VAPID_PRIVATE_KEY!,
    // )
    //
    // let enviadas = 0
    // for (const sub of suscripciones) {
    //   try {
    //     await webpush.sendNotification(
    //       { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    //       payload
    //     )
    //     enviadas++
    //   } catch {
    //     // Suscripcion expirada — eliminar
    //     await supabase
    //       .from('push_suscripciones')
    //       .delete()
    //       .eq('endpoint', sub.endpoint)
    //   }
    // }
    // return NextResponse.json({ ok: true, enviadas })

    // ── Modo simulacion (sin web-push instalado) ──────────────
    logger.info('[Push][Simulacion] Payload a enviar:', payload)
    logger.info('[Push][Simulacion] Suscripciones:', suscripciones.length)

    return NextResponse.json({
      ok: true,
      enviadas: suscripciones.length,
      simulacion: true,
      mensaje: 'Instala web-push y descomenta el envio real en route.ts para activar.',
    })
  } catch {
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
