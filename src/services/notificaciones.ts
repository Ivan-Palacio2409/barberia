import { createClient } from '@/lib/supabase/client'
import type { CanalNotificacion, Notificacion, TipoNotificacion } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: notificaciones
// [C3] Solo programa y consulta filas en la tabla. El envío real
// (email/whatsapp) lo hace la arquitectura multi-canal de la
// Fase 22 (NotificationProvider), que lee estas mismas filas.
// ============================================================

interface ProgramarNotificacionParams {
  cliente_id: string
  tipo: TipoNotificacion
  fecha_programada: string
  cita_id?: string
  canal?: CanalNotificacion
}

export async function programarNotificacion({
  cliente_id,
  tipo,
  fecha_programada,
  cita_id,
  canal = 'email',
}: ProgramarNotificacionParams): Promise<Notificacion | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notificaciones')
    .insert({ cliente_id, cita_id, tipo, canal, fecha_programada })
    .select()
    .single()

  if (error) {
    logger.error('Error al programar la notificación:', error.message)
    return null
  }

  return data as Notificacion
}

export async function getNotificacionesPendientes(): Promise<Notificacion[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('enviado', false)
    .lte('fecha_programada', new Date().toISOString())
    .order('fecha_programada', { ascending: true })

  if (error) {
    logger.error('Error al obtener las notificaciones pendientes:', error.message)
    return []
  }

  return data as Notificacion[]
}

export async function getNotificacionesByCliente(clienteId: string): Promise<Notificacion[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('destinatario', 'cliente')
    .order('fecha_programada', { ascending: false })

  if (error) {
    logger.error('Error al obtener las notificaciones del cliente:', error.message)
    return []
  }

  return data as Notificacion[]
}

export async function marcarNotificacionComoEnviada(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notificaciones')
    .update({ enviado: true })
    .eq('id', id)

  if (error) {
    logger.error('Error al marcar la notificación como enviada:', error.message)
    return false
  }

  return true
}
