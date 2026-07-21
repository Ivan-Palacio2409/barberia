// ============================================================
// lib/notifications/copy.ts
// H5 (post fase 30) — texto en español por tipo de notificación,
// compartido entre EmailProvider y WhatsAppProvider para no
// duplicar el mapeo tipo → mensaje en cada canal.
//
// Rehecho: sin 'confirmacion_pago' (no hay pagos en el sitio).
// Se agregan tipos para notificar al ADMIN (nueva reserva,
// resumen nocturno, recordatorio 1h) y el recordatorio 1h para
// el cliente.
// ============================================================

import type { NotificationPayload } from './index'

function formatFecha(fecha?: string): string {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function construirCopy(payload: NotificationPayload): { asunto: string; mensaje: string } {
  const nombre = payload.cliente.nombre?.split(' ')[0] || 'hola'
  const fecha = formatFecha(payload.cita?.fecha)
  const hora = payload.cita?.hora_inicio ?? ''
  const esAdmin = Boolean(payload.contacto)
  const linkResena = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/cliente/resenas/nueva?cita=${payload.cita?.id ?? ''}`

  switch (payload.tipo) {
    case 'confirmacion_cita':
      return {
        asunto: 'Tu cita en BARBERÍA está confirmada',
        mensaje: `Hola ${nombre}, tu cita quedó agendada para el ${fecha} a las ${hora}. ¡Te esperamos! El pago se realiza en el local.`,
      }

    case 'nueva_reserva_admin':
      return {
        asunto: 'Nueva reserva recibida',
        mensaje: `Nueva reserva: ${payload.cliente.nombre} agendó una cita para el ${fecha} a las ${hora}.${payload.cliente.telefono ? ` Tel: ${payload.cliente.telefono}.` : ''}`,
      }

    case 'recordatorio_24_horas':
      return {
        asunto: 'Recordatorio: tu cita es mañana',
        mensaje: `Hola ${nombre}, te recordamos tu cita en BARBERÍA mañana ${fecha} a las ${hora}.`,
      }

    case 'recordatorio_mismo_dia':
      return {
        asunto: 'Tu cita es hoy',
        mensaje: `Hola ${nombre}, hoy ${fecha} tienes tu cita a las ${hora} en BARBERÍA. ¡Nos vemos pronto!`,
      }

    case 'recordatorio_1_hora':
      return esAdmin
        ? {
            asunto: 'Cita en 1 hora',
            mensaje: `Recordatorio: ${payload.cliente.nombre} tiene una cita a las ${hora} (en 1 hora).${payload.cliente.telefono ? ` Tel: ${payload.cliente.telefono}.` : ''}`,
          }
        : {
            asunto: 'Tu cita es en 1 hora',
            mensaje: `Hola ${nombre}, tu cita en BARBERÍA es en 1 hora (${hora}). ¡Te esperamos!`,
          }

    case 'resumen_diario_admin': {
      const lista = (payload.resumenCitas ?? [])
        .map((c) => `${c.hora_inicio.slice(0, 5)} - ${c.cliente_nombre} (${c.servicios})`)
        .join('\n')
      const total = payload.resumenCitas?.length ?? 0
      const etiquetaDia = payload.esHoy ? 'hoy' : 'mañana'
      return {
        asunto: `Agenda de ${etiquetaDia}: ${total} cita${total === 1 ? '' : 's'}`,
        mensaje: total > 0
          ? `Citas para ${etiquetaDia}:\n${lista}`
          : `No tienes citas agendadas para ${etiquetaDia}.`,
      }
    }

    case 'reagendamiento_cita':
      return {
        asunto: 'Tu cita fue reagendada',
        mensaje: `Hola ${nombre}, tu cita fue reagendada para el ${fecha} a las ${hora}.`,
      }
    case 'cancelacion_cita':
      return esAdmin
        ? {
            asunto: 'Una cita fue cancelada',
            mensaje: `${payload.cliente.nombre} canceló su cita del ${fecha}${hora ? ` a las ${hora}` : ''}.${payload.cliente.telefono ? ` Tel: ${payload.cliente.telefono}.` : ''}`,
          }
        : {
            asunto: 'Tu cita fue cancelada',
            mensaje: `Hola ${nombre}, tu cita del ${fecha} fue cancelada. Si fue un error, contáctanos.`,
          }
    case 'solicitud_resena':
      return {
        asunto: '¿Cómo te fue en BARBERÍA?',
        mensaje: `Hola ${nombre}, nos encantaría conocer tu opinión sobre tu última visita. Déjanos tu reseña aquí: ${linkResena}`,
      }
    case 'aviso_lista_espera':
      return {
        asunto: 'Se liberó un horario para ti',
        mensaje: `Hola ${nombre}, se liberó un horario que te puede interesar. Contáctanos para confirmarlo.`,
      }
    case 'solicitud_eliminacion_cuenta':
      return {
        asunto: 'Solicitud ARCO: eliminación de cuenta',
        mensaje: `${payload.cliente.nombre} solicitó la eliminación de su cuenta y datos (Ley 1581/2012).${payload.cliente.telefono ? ` Tel: ${payload.cliente.telefono}.` : ''} Plazo máximo de respuesta: 15 días hábiles.`,
      }
    default:
      return {
        asunto: 'Novedad sobre tu cita en BARBERÍA',
        mensaje: `Hola ${nombre}, tenemos una novedad sobre tu cita.`,
      }
  }
}