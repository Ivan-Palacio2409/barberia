// ============================================================
// lib/notifications/index.ts — Fase 1 / Fase 22 [C3]
// Arquitectura multi-canal de notificaciones.
// La interfaz NotificationProvider permite agregar canales
// (email, WhatsApp, push) sin cambios estructurales.
// ============================================================

import type { TipoNotificacion, CanalNotificacion, Cliente, Cita } from '@/types'

// ── Item de una cita, usado en el resumen nocturno del admin ──
export interface ResumenCitaAdmin {
  hora_inicio: string
  cliente_nombre: string
  servicios: string
}

// ── Contrato ──────────────────────────────────────────────────
export interface NotificationPayload {
  tipo: TipoNotificacion
  canal: CanalNotificacion
  /** Cliente relacionado a la cita — se usa para el TEXTO del mensaje
   *  (ej. "Hola María, ..."), incluso cuando el destinatario real es
   *  el admin (ver `contacto`). */
  cliente: Cliente
  cita?: Cita
  /** Si se define, el mensaje se envía a este email/teléfono en vez
   *  del email/teléfono de `cliente`. Se usa para notificar al admin
   *  (nueva reserva, recordatorio 1h, resumen diario) sin necesitar
   *  un "cliente" ficticio en la base de datos. */
  contacto?: { email?: string; telefono?: string }
  /** Solo para 'resumen_diario_admin': lista de citas del día siguiente. */
  resumenCitas?: ResumenCitaAdmin[]
  /** Solo para 'resumen_diario_admin': true si el resumen es de las citas
   *  de HOY (corrida de la mañana), false/undefined si es de MAÑANA
   *  (corrida de la noche anterior). */
  esHoy?: boolean
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>
}

// Re-exports para uso externo
export type { TipoNotificacion, CanalNotificacion }