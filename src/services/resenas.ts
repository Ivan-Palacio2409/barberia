import { createClient } from '@/lib/supabase/client'
import type { Resena } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: resenas — Fase 15
// Nota: getResenasServer()/getPromedioCalificacionServer()
// (server-only) viven en resenas-ssr.ts — ver el comentario de
// ese archivo. Este módulo solo debe contener funciones de
// cliente de navegador, porque lo importan Client Components.
// ============================================================

// ============================================================
// Fase 27: join resenas -> citas -> cita_servicios -> servicios
// para mostrar el servicio reseñado en admin y portal publico.
// ============================================================

// Forma cruda que devuelve Supabase antes de normalizar
interface ResenaConCitaRaw {
  id: string
  cliente_id: string
  cita_id?: string | null
  puntuacion: number
  comentario?: string
  created_at: string
  cliente?: { id: string; nombre: string } | null
  cita?: {
    id: string
    fecha: string
    cita_servicios?: { servicio: { nombre: string } | null }[] | null
  } | null
}

function normalizarResena(r: ResenaConCitaRaw): Resena {
  const serviciosNombres = (r.cita?.cita_servicios ?? [])
    .map((cs) => cs.servicio?.nombre)
    .filter((n): n is string => Boolean(n))

  return {
    id: r.id,
    cliente_id: r.cliente_id,
    cita_id: r.cita_id ?? null,
    puntuacion: r.puntuacion,
    comentario: r.comentario,
    created_at: r.created_at,
    cliente: r.cliente as Resena['cliente'],
    cita: r.cita
      ? { id: r.cita.id, fecha: r.cita.fecha, servicios_nombres: serviciosNombres }
      : undefined,
  }
}

const SELECT_RESENA_CON_CITA = `
  *,
  cliente:clientes(id, nombre),
  cita:citas(
    id,
    fecha,
    cita_servicios(servicio:servicios(nombre))
  )
`

export async function getResenas(limite?: number): Promise<Resena[]> {
  const supabase = createClient()

  let query = supabase
    .from('resenas')
    .select(SELECT_RESENA_CON_CITA)
    .order('created_at', { ascending: false })

  if (limite) {
    query = query.limit(limite)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Error al obtener las reseñas:', error.message)
    return []
  }

  return (data as unknown as ResenaConCitaRaw[]).map(normalizarResena)
}

export async function getPromedioCalificacion(): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.from('resenas').select('puntuacion')

  if (error || !data || data.length === 0) {
    if (error) logger.error('Error al calcular el promedio:', error.message)
    return 0
  }

  const suma = data.reduce((total, r) => total + r.puntuacion, 0)
  return Math.round((suma / data.length) * 10) / 10
}

// Verificar si un cliente ya dejó reseña (evitar duplicados por cita)
export async function clienteYaTieneResena(clienteId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resenas')
    .select('id')
    .eq('cliente_id', clienteId)
    .limit(1)

  if (error) return false
  return (data?.length ?? 0) > 0
}

// Fase 26: verificar si una cita especifica ya tiene resena
export async function citaYaTieneResena(citaId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resenas')
    .select('id')
    .eq('cita_id', citaId)
    .limit(1)

  if (error) return false
  return (data?.length ?? 0) > 0
}

// Fase 26/27: resenas del cliente autenticado, con join de cita y servicio
export async function getResenasCliente(clienteId: string): Promise<Resena[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resenas')
    .select(SELECT_RESENA_CON_CITA)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error al obtener resenas del cliente:', error.message)
    return []
  }

  return (data as unknown as ResenaConCitaRaw[]).map(normalizarResena)
}

interface CrearResenaParams {
  cliente_id: string
  puntuacion: number
  comentario?: string
  cita_id?: string   // Fase 26: asociar resena a una cita especifica
}

export async function crearResena({
  cliente_id,
  puntuacion,
  comentario,
  cita_id,
}: CrearResenaParams): Promise<Resena | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resenas')
    .insert({ cliente_id, puntuacion, comentario, cita_id })
    .select()
    .single()

  if (error) {
    logger.error('Error al crear la reseña:', error.message)
    throw error
  }

  return data as Resena
}

export async function eliminarResena(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('resenas').delete().eq('id', id)

  if (error) {
    logger.error('Error al eliminar la reseña:', error.message)
    return false
  }

  return true
}
