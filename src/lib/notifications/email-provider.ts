// ============================================================
// lib/notifications/email-provider.ts — Fase 22 [C3] / H5
// Proveedor de email real usando la API de Resend.
//
// H5 (post fase 30): antes esto era un console.log — nadie lo
// llamaba y no enviaba nada de verdad. Ahora hace el POST real a
// Resend.
//
// Si RESEND_API_KEY no está configurada o no hay email de destino,
// send() LANZA un error (no devuelve en silencio). Esto es a
// propósito: dispatcher.ts usa el resultado de send() para decidir
// si la notificación se marca como `enviado = true` en la cola. Si
// send() "tuviera éxito" en silencio sin mandar nada, el sistema
// creería que la notificación llegó cuando en realidad no llegó a
// nadie — eso es peor que un error visible en los logs.
//
// Cuando tengas la API key de Resend:
//   1. Agrega RESEND_API_KEY en las variables de entorno (.env / Supabase Secrets / Vercel).
//   2. Agrega RESEND_FROM_EMAIL con un remitente de un dominio verificado en Resend
//      (ej. "BARBERÍA <notificaciones@tudominio.com>"). Mientras no lo configures,
//      usa el remitente de pruebas de Resend (onboarding@resend.dev), que solo
//      entrega al correo con el que te registraste en Resend.
// Nada más cambia — el resto del flujo ya está armado.
// ============================================================

import type { NotificationProvider, NotificationPayload } from './index'
import { construirCopy } from './copy'
import { logger } from '@/lib/logger'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export class EmailProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    const email = payload.contacto?.email ?? payload.cliente.email

    if (!email) {
      logger.warn('[EmailProvider] Sin email de destino, se omite envío.', payload.tipo, payload.cliente.id)
      throw new Error('Sin email de destino')
    }

    if (!apiKey) {
      logger.warn(
        '[EmailProvider] RESEND_API_KEY no configurada — no se envía email real. ' +
          'Configúrala cuando tengas las credenciales del cliente final.',
        payload.tipo,
        '→',
        email,
      )
      throw new Error('RESEND_API_KEY no configurada')
    }

    const from = process.env.RESEND_FROM_EMAIL || 'BARBERÍA <onboarding@resend.dev>'
    const { asunto, mensaje } = construirCopy(payload)

    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: asunto,
        html: `<p>${mensaje}</p>`,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Resend respondió ${res.status}: ${body}`)
    }
  }
}