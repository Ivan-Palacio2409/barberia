import { createClient } from '@/lib/supabase/client'
import type { CitaConServicios, EstadoCita, TipoNotificacion, CanalNotificacion } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// Funciones de acceso a citas — Fase 13
// Se ejecutan en Client Components usando el cliente de browser.
// RLS en Supabase garantiza que cliente solo ve sus propias citas.
// ============================================================

// ── Obtener todas las citas del cliente autenticado ──────────
export async function getCitasByCliente(clienteId: string): Promise<CitaConServicios[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('citas')
    .select(`
      *,
      cita_servicios (
        id,
        servicio:servicios (
          id,
          nombre,
          precio,
          duracion_minutos,
          categoria_id
        )
      )
    `)
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CitaConServicios[]
}

// ── Reagendar cita ───────────────────────────────────────────
// Valida que la cita pertenezca al cliente antes de actualizar.
export async function reagendarCita(
  citaId: string,
  clienteId: string,
  nuevaFecha: string,
  nuevaHoraInicio: string,
  nuevaHoraFin: string
): Promise<void> {
  const supabase = createClient()

  // Verificar propiedad (segunda capa de seguridad; RLS es la primera)
  const { data: cita, error: fetchError } = await supabase
    .from('citas')
    .select('id, cliente_id, estado')
    .eq('id', citaId)
    .eq('cliente_id', clienteId)
    .maybeSingle()

  if (fetchError || !cita) {
    throw new Error('No tienes permiso para reagendar esta cita.')
  }

  if (cita.estado === 'cancelada' || cita.estado === 'completada') {
    throw new Error('No se puede reagendar una cita cancelada o completada.')
  }

  const { error: updateError } = await supabase
    .from('citas')
    .update({
      fecha: nuevaFecha,
      hora_inicio: nuevaHoraInicio,
      hora_fin: nuevaHoraFin,
      estado: 'pendiente' as EstadoCita,
    })
    .eq('id', citaId)
    .eq('cliente_id', clienteId)

  if (updateError) throw new Error(updateError.message)

  // Insertar notificación de reagendamiento
  await insertarNotificacion(citaId, clienteId, 'reagendamiento_cita', 'whatsapp')
}

// ── Cancelar cita ────────────────────────────────────────────
export async function cancelarCita(citaId: string, clienteId: string): Promise<void> {
  const supabase = createClient()

  const { data: cita, error: fetchError } = await supabase
    .from('citas')
    .select('id, cliente_id, estado')
    .eq('id', citaId)
    .eq('cliente_id', clienteId)
    .maybeSingle()

  if (fetchError || !cita) {
    throw new Error('No tienes permiso para cancelar esta cita.')
  }

  if (cita.estado === 'cancelada') {
    throw new Error('La cita ya está cancelada.')
  }

  if (cita.estado === 'completada') {
    throw new Error('No se puede cancelar una cita completada.')
  }

  const { error: updateError } = await supabase
    .from('citas')
    .update({ estado: 'cancelada' as EstadoCita })
    .eq('id', citaId)
    .eq('cliente_id', clienteId)

  if (updateError) throw new Error(updateError.message)

  // Insertar notificación de cancelación — al cliente y al admin,
  // solo por WhatsApp (sin email configurado en este proyecto).
  await insertarNotificacion(citaId, clienteId, 'cancelacion_cita', 'whatsapp', 'cliente')
  await insertarNotificacion(citaId, clienteId, 'cancelacion_cita', 'whatsapp', 'admin')
}

// ── Obtener horarios disponibles para una fecha y duración ───
export async function getHorariosDisponibles(
  fecha: string,
  duracionMinutos: number
): Promise<string[]> {
  const res = await fetch(
    `/api/disponibilidad?fecha=${fecha}&duracion=${duracionMinutos}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.horarios ?? [])
}

// ── Helper: insertar notificación ───────────────────────────
async function insertarNotificacion(
  citaId: string,
  clienteId: string,
  tipo: TipoNotificacion,
  canal: CanalNotificacion,
  destinatario: 'cliente' | 'admin' = 'cliente'
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('notificaciones').insert({
    cita_id: citaId,
    cliente_id: clienteId,
    tipo,
    canal,
    destinatario,
    enviado: false,
    fecha_programada: new Date().toISOString(),
  })
  // QA fase 30 (M3): antes el error se ignoraba por completo, sin
  // registro. No se relanza (para no bloquear la operación
  // principal: reagendar/cancelar la cita ya se hizo), pero ahora
  // queda logueado para poder detectar el problema.
  if (error) {
    logger.error('[insertarNotificacion] No se pudo registrar la notificación:', tipo, citaId, error.message)
  }
}