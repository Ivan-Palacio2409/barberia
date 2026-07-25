import { createClient } from '@/lib/supabase/server'
import type { EstadoListaEspera, ListaEspera } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// src/services/lista-espera-admin.ts — Fase 23
// Consultas server-side para el panel admin de lista de espera.
// ============================================================

export interface ListaEsperaConCliente extends Omit<ListaEspera, 'cliente'> {
  cliente: {
    id: string
    nombre: string
    telefono: string
    email?: string
  }
}

export async function getListaEsperaAdmin(
  estado?: EstadoListaEspera | ''
): Promise<ListaEsperaConCliente[]> {
  const supabase = await createClient()

  let query = supabase
    .from('lista_espera')
    .select(`
      *,
      cliente:clientes ( id, nombre, telefono, email )
    `)
    .order('fecha_solicitada', { ascending: true })
    .order('created_at', { ascending: true })

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query

  if (error) {
    logger.error('[getListaEsperaAdmin] Error:', error.message)
    return []
  }

  return data as unknown as ListaEsperaConCliente[]
}

export async function getResumenListaEspera(): Promise<{
  en_espera: number
  notificado: number
  convertido: number
  cancelado: number
  total: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lista_espera')
    .select('estado')

  if (error || !data) {
    return { en_espera: 0, notificado: 0, convertido: 0, cancelado: 0, total: 0 }
  }

  const counts = { en_espera: 0, notificado: 0, convertido: 0, cancelado: 0 }
  data.forEach(r => {
    const k = r.estado as keyof typeof counts
    if (k in counts) counts[k]++
  })

  return { ...counts, total: data.length }
}

export async function cambiarEstadoListaEspera(
  id: string,
  estado: EstadoListaEspera,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', adminId)
    .single()

  if (profile?.rol !== 'administrador') {
    return { ok: false, error: 'Acceso denegado.' }
  }

  const { error } = await supabase
    .from('lista_espera')
    .update({ estado })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Si notificado, registrar notificacion en la tabla
  if (estado === 'notificado') {
    // Obtener cliente_id
    const { data: fila } = await supabase
      .from('lista_espera')
      .select('cliente_id')
      .eq('id', id)
      .single()

    if (fila?.cliente_id) {
      const { error: errorNotif } = await supabase.from('notificaciones').insert({
        cliente_id: fila.cliente_id,
        tipo: 'aviso_lista_espera',
        canal: 'whatsapp',
        fecha_programada: new Date().toISOString(),
        enviado: false,
      })
      // QA fase 30 (M3): antes se ignoraba en silencio.
      if (errorNotif) {
        logger.error('[actualizarEstadoListaEspera] No se pudo registrar la notificación de aviso:', id, errorNotif.message)
      }
    }
  }

  return { ok: true }
}

// ============================================================
// convertirListaEsperaEnCita — Ajuste solicitado:
// Al darle "Convertir" a una solicitud, ya no basta con cambiar
// el estado a "convertido": hay que (1) crear la cita real en el
// calendario usando la fecha y hora que pidio el cliente,
// (2) avisarle de inmediato que su cita quedo aceptada, y solo
// entonces (3) marcar la solicitud como convertida.
//
// El negocio solo ofrece un servicio activo ("Corte", ver
// migracion 040), asi que se toman todos los servicios `activo`
// para calcular duracion y precio — si en el futuro se agregan
// mas servicios, esto sigue funcionando sin cambios.
// ============================================================
export async function convertirListaEsperaEnCita(
  id: string,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', adminId)
    .single()

  if (profile?.rol !== 'administrador') {
    return { ok: false, error: 'Acceso denegado.' }
  }

  // Traer la solicitud completa
  const { data: solicitud, error: errSolicitud } = await supabase
    .from('lista_espera')
    .select('id, cliente_id, fecha_solicitada, hora_solicitada, servicios_deseados, estado')
    .eq('id', id)
    .single()

  if (errSolicitud || !solicitud) {
    return { ok: false, error: 'No se encontró la solicitud.' }
  }

  if (solicitud.estado === 'convertido') {
    return { ok: false, error: 'Esta solicitud ya fue convertida.' }
  }

  if (!solicitud.hora_solicitada) {
    return {
      ok: false,
      error: 'Esta solicitud no tiene una hora especificada (es anterior a este cambio). Contacta al cliente para acordar la hora y crea la cita manualmente desde el calendario.',
    }
  }

  // Servicios activos del negocio (hoy solo existe "Corte")
  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, duracion_minutos, precio')
    .eq('activo', true)

  const listaServicios = servicios ?? []
  const duracionTotal = listaServicios.reduce((acc, s) => acc + (s.duracion_minutos ?? 0), 0) || 30
  const precioTotal = listaServicios.reduce((acc, s) => acc + Number(s.precio ?? 0), 0)

  // Calcular hora_fin a partir de hora_solicitada + duracion
  const [h, m] = solicitud.hora_solicitada.slice(0, 5).split(':').map(Number)
  const inicioMin = h * 60 + m
  const finMin = inicioMin + duracionTotal
  const horaInicioFmt = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`

  // Verificar solapamiento (el trigger de BD tambien lo rechaza)
  const { data: solapadas } = await supabase
    .from('citas')
    .select('id')
    .eq('fecha', solicitud.fecha_solicitada)
    .neq('estado', 'cancelada')
    .or(`hora_inicio.lt.${horaFin},hora_fin.gt.${horaInicioFmt}`)

  if (solapadas && solapadas.length > 0) {
    return {
      ok: false,
      error: 'Ya existe una cita en ese horario. Reagenda al cliente manualmente desde el calendario.',
    }
  }

  // Crear la cita
  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .insert({
      cliente_id: solicitud.cliente_id,
      fecha: solicitud.fecha_solicitada,
      hora_inicio: horaInicioFmt,
      hora_fin: horaFin,
      estado: 'confirmada',
      precio_total: precioTotal,
      notas: solicitud.servicios_deseados
        ? `Creada desde lista de espera. Servicios deseados: ${solicitud.servicios_deseados}`
        : 'Creada desde lista de espera.',
    })
    .select('id')
    .single()

  if (citaError || !cita) {
    return { ok: false, error: citaError?.message ?? 'No se pudo crear la cita.' }
  }

  // Vincular servicios a la cita
  if (listaServicios.length > 0) {
    const { error: csError } = await supabase
      .from('cita_servicios')
      .insert(listaServicios.map((s) => ({ cita_id: cita.id, servicio_id: s.id })))
    if (csError) {
      logger.error('[convertirListaEsperaEnCita] Error al vincular servicios:', csError.message)
    }
  }

  // Marcar la solicitud como convertida
  const { error: errEstado } = await supabase
    .from('lista_espera')
    .update({ estado: 'convertido' })
    .eq('id', id)

  if (errEstado) {
    logger.error('[convertirListaEsperaEnCita] Cita creada pero no se pudo marcar la solicitud como convertida:', errEstado.message)
  }

  // Avisar de inmediato al cliente que su cita quedo aceptada
  const { error: errorNotif } = await supabase.from('notificaciones').insert({
    cliente_id: solicitud.cliente_id,
    cita_id: cita.id,
    tipo: 'confirmacion_cita',
    canal: 'whatsapp',
    fecha_programada: new Date().toISOString(),
    enviado: false,
  })

  if (errorNotif) {
    logger.error('[convertirListaEsperaEnCita] No se pudo registrar la notificación de confirmación:', errorNotif.message)
  }

  return { ok: true }
}