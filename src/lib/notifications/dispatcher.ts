// ============================================================
// lib/notifications/dispatcher.ts — Fase 22 [C3] / H5
// Despacha notificaciones al provider correcto según el canal.
// Fallback a email si WhatsApp falla.
//
// H5 (post fase 30): dispatch() ya existía pero nadie lo llamaba
// — ver src/app/api/notificaciones/procesar/route.ts, que es quien
// ahora lo invoca para cada notificación pendiente. También ahora
// devuelve `true`/`false` en vez de `void`: quien procesa la cola
// necesita saber si el envío fue exitoso para decidir si marca
// `enviado = true` o la deja pendiente para reintentar (QA M3).
// ============================================================

import { EmailProvider } from './email-provider'
import { WhatsAppProvider } from './whatsapp-provider'
import type { NotificationPayload, ResumenCitaAdmin } from './index'
import type { TipoNotificacion, CanalNotificacion, Cliente, Cita } from '@/types'
import { logger } from '@/lib/logger'

export async function dispatch(
  tipo: TipoNotificacion,
  cliente: Cliente,
  cita?: Cita,
  canal: CanalNotificacion = 'email',
  contacto?: { email?: string; telefono?: string },
  resumenCitas?: ResumenCitaAdmin[],
  esHoy?: boolean,
): Promise<boolean> {
  const payload: NotificationPayload = { tipo, canal, cliente, cita, contacto, resumenCitas, esHoy }

  if (canal === 'email') {
    try {
      await new EmailProvider().send(payload)
      return true
    } catch (e) {
      logger.error('[dispatch] Falló el envío de email:', tipo, cliente.id, e)
      return false
    }
  }

  if (canal === 'whatsapp') {
    try {
      await new WhatsAppProvider().send(payload)
      return true
    } catch {
      // Fallback a email
      try {
        await new EmailProvider().send({ ...payload, canal: 'email' })
        return true
      } catch (e) {
        logger.error('[dispatch] Falló WhatsApp y también el fallback a email:', tipo, cliente.id, e)
        return false
      }
    }
  }

  if (canal === 'ambos') {
    let emailOk = false
    try {
      await new EmailProvider().send({ ...payload, canal: 'email' })
      emailOk = true
    } catch (e) {
      logger.error('[dispatch] Falló el envío de email (canal ambos):', tipo, cliente.id, e)
    }
    try {
      await new WhatsAppProvider().send({ ...payload, canal: 'whatsapp' })
    } catch (e) {
      // WhatsApp falla; email ya se intentó por su cuenta. No es
      // fatal si al menos el email salió bien.
      logger.warn('[dispatch] Falló WhatsApp (canal ambos), email ya se intentó por separado:', tipo, cliente.id, e)
    }
    return emailOk
  }

  return false
}