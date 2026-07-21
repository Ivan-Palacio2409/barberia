// ============================================================
// lib/notifications/whatsapp-provider.ts — Fase 23 [C3] / H5
// Proveedor de WhatsApp real usando WhatsApp Cloud API (Meta).
//
// H5 (post fase 30): igual que EmailProvider, esto era un stub que
// solo logueaba. Ahora hace el POST real al Graph API. Si faltan
// las credenciales (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_ID), no
// revienta: loguea una advertencia y el dispatcher hace fallback a
// email automáticamente (ver dispatcher.ts).
//
// Cuando tengas las credenciales de WhatsApp Business:
//   1. Agrega WHATSAPP_API_TOKEN y WHATSAPP_PHONE_ID en las variables de entorno.
//   2. IMPORTANTE — ventana de 24 horas: Meta solo permite mensajes de texto libres
//      dentro de las 24h desde el último mensaje del cliente. Fuera de esa ventana
//      (típicamente confirmacion_cita, recordatorios) hace falta un "message
//      template" pre-aprobado por Meta en vez de un mensaje de texto simple. Este
//      provider manda texto libre; si Meta rechaza el mensaje fuera de ventana, el
//      dispatcher cae a email automáticamente. Cuando tengas los templates
//      aprobados, cambiar el body de este fetch a type: "template" es el único
//      ajuste necesario.
// ============================================================

import type { NotificationProvider, NotificationPayload } from './index'
import { construirCopy } from './copy'
import { logger } from '@/lib/logger'

function normalizarTelefono(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, '')
  // Si ya viene con indicativo de país (57 + 10 dígitos = 12), se respeta.
  if (soloDigitos.length === 12 && soloDigitos.startsWith('57')) return soloDigitos
  return `57${soloDigitos}`
}

export class WhatsAppProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    const token = process.env.WHATSAPP_API_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID
    const telefono = payload.contacto?.telefono ?? payload.cliente.telefono

    if (!telefono) {
      logger.warn('[WhatsAppProvider] Sin teléfono de destino, se omite envío.', payload.tipo, payload.cliente.id)
      return
    }

    if (!token || !phoneId) {
      logger.warn(
        '[WhatsAppProvider] WHATSAPP_API_TOKEN/WHATSAPP_PHONE_ID no configurados — no se envía WhatsApp real.',
        payload.tipo,
      )
      throw new Error('WhatsApp no configurado') // fuerza el fallback a email en el dispatcher
    }

    const { mensaje } = construirCopy(payload)
    const destinatario = normalizarTelefono(telefono)

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: destinatario,
        type: 'text',
        text: { body: mensaje },
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`WhatsApp Cloud API respondió ${res.status}: ${body}`)
    }
  }
}
