import { createClient } from '@/lib/supabase/client'
import type { Cita, CitaServicio, EstiloReferencia, EstadoCita } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: citas
// CRUD de citas, gestión de servicios asociados (tabla puente
// cita_servicios) y de las imágenes de referencia adjuntas.
// ============================================================

const SELECT_CITA_COMPLETA = `
  *,
  cliente:clientes(*),
  cita_servicios(servicio:servicios(*)),
  estilos_referencia(*)
`

export async function getCitasByCliente(clienteId: string): Promise<Cita[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('citas')
    .select(SELECT_CITA_COMPLETA)
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })

  if (error) {
    logger.error('Error al obtener las citas del cliente:', error.message)
    return []
  }

  return data as unknown as Cita[]
}

export async function getCitasPorFecha(fecha: string): Promise<Cita[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('citas')
    .select(SELECT_CITA_COMPLETA)
    .eq('fecha', fecha)
    .neq('estado', 'cancelada')
    .order('hora_inicio', { ascending: true })

  if (error) {
    logger.error('Error al obtener las citas del día:', error.message)
    return []
  }

  return data as unknown as Cita[]
}

export async function getCitaById(id: string): Promise<Cita | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('citas')
    .select(SELECT_CITA_COMPLETA)
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error al obtener la cita:', error.message)
    return null
  }

  return data as unknown as Cita
}

interface CrearCitaParams {
  cliente_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  servicios_ids: string[]
  precio_total?: number
  notas?: string
}

// Crea la cita y, en la misma operación, sus filas en la tabla
// puente cita_servicios. Si el trigger anti-solapamiento rechaza
// la cita (horario ocupado), la función propaga el error tal cual
// para que la UI muestre el mensaje "Ya existe una cita en ese horario".
export async function crearCita({
  cliente_id,
  fecha,
  hora_inicio,
  hora_fin,
  servicios_ids,
  precio_total,
  notas,
}: CrearCitaParams): Promise<Cita | null> {
  const supabase = createClient()

  const { data: cita, error: errorCita } = await supabase
    .from('citas')
    .insert({ cliente_id, fecha, hora_inicio, hora_fin, precio_total, notas, estado: 'confirmada' })
    .select()
    .single()

  if (errorCita) {
    logger.error('Error al crear la cita:', errorCita.message)
    throw errorCita
  }

  const filasServicios = servicios_ids.map((servicio_id) => ({
    cita_id: cita.id,
    servicio_id,
  }))

  const { error: errorServicios } = await supabase
    .from('cita_servicios')
    .insert(filasServicios)

  if (errorServicios) {
    logger.error('Error al asociar servicios a la cita:', errorServicios.message)
    throw errorServicios
  }

  return getCitaById(cita.id)
}

export async function actualizarEstadoCita(
  id: string,
  estado: EstadoCita
): Promise<Cita | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('citas')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar el estado de la cita:', error.message)
    return null
  }

  return data as Cita
}

// ── Asistencia post-cita ──────────────────────────────────────
// Se llama cuando ya pasó la hora estimada de fin de la cita y el
// cliente o el admin confirman si hubo asistencia. Si asistió, se
// programa de inmediato la solicitud de reseña.
export async function marcarAsistencia(
  citaId: string,
  clienteId: string,
  asistio: boolean,
  confirmadoPor: 'cliente' | 'admin'
): Promise<Cita | null> {
  const supabase = createClient()

  const nuevoEstado: EstadoCita = asistio ? 'completada' : 'no_asistio'

  const { data, error } = await supabase
    .from('citas')
    .update({
      estado: nuevoEstado,
      asistio,
      asistencia_confirmada_por: confirmadoPor,
      asistencia_confirmada_at: new Date().toISOString(),
    })
    .eq('id', citaId)
    .select()
    .single()

  if (error) {
    logger.error('Error al registrar asistencia:', error.message)
    return null
  }

  if (asistio) {
    const { error: errorNotif } = await supabase.from('notificaciones').insert({
      cliente_id: clienteId,
      cita_id: citaId,
      tipo: 'solicitud_resena',
      canal: 'whatsapp',
      destinatario: 'cliente',
      fecha_programada: new Date().toISOString(),
      enviado: false,
    })

    if (errorNotif) {
      logger.error('No se pudo programar la solicitud de reseña:', errorNotif.message)
    } else {
      await supabase
        .from('citas')
        .update({ resena_solicitada: true, resena_solicitada_at: new Date().toISOString() })
        .eq('id', citaId)
    }
  }

  return data as Cita
}

export async function reprogramarCita(
  id: string,
  fecha: string,
  hora_inicio: string,
  hora_fin: string
): Promise<Cita | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('citas')
    .update({ fecha, hora_inicio, hora_fin })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al reprogramar la cita:', error.message)
    throw error
  }

  return data as Cita
}

export async function cancelarCita(id: string): Promise<Cita | null> {
  return actualizarEstadoCita(id, 'cancelada')
}

// ── Cancelar cita desde el admin (H5) ──────────────────────────
// A diferencia de actualizarEstadoCita() (genérica, sin notificar),
// esta función SÍ notifica al cliente por WhatsApp de que su cita
// fue cancelada por el negocio. Se usa desde el panel de
// administración en vez de cancelarCita()/actualizarEstadoCita().
export async function cancelarCitaAdmin(id: string, clienteId: string): Promise<Cita | null> {
  const cita = await actualizarEstadoCita(id, 'cancelada')
  if (!cita) return null

  const supabase = createClient()
  const { error } = await supabase.from('notificaciones').insert({
    cita_id: id,
    cliente_id: clienteId,
    tipo: 'cancelacion_cita',
    canal: 'whatsapp',
    destinatario: 'cliente',
    enviado: false,
    fecha_programada: new Date().toISOString(),
  })

  if (error) {
    logger.error('Error al registrar la notificación de cancelación (admin):', error.message)
  }

  return cita
}

export async function getServiciosDeCita(citaId: string): Promise<CitaServicio[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cita_servicios')
    .select('*, servicio:servicios(*)')
    .eq('cita_id', citaId)

  if (error) {
    logger.error('Error al obtener los servicios de la cita:', error.message)
    return []
  }

  return data as CitaServicio[]
}

export async function agregarEstiloReferencia(
  citaId: string,
  urlImagen: string
): Promise<EstiloReferencia | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('estilos_referencia')
    .insert({ cita_id: citaId, url_imagen: urlImagen })
    .select()
    .single()

  if (error) {
    logger.error('Error al agregar el diseño de referencia:', error.message)
    return null
  }

  return data as EstiloReferencia
}

export async function eliminarEstiloReferencia(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('estilos_referencia').delete().eq('id', id)

  if (error) {
    logger.error('Error al eliminar el diseño de referencia:', error.message)
    return false
  }

  return true
}
