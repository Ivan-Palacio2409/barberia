import { createClient as createClientClient } from '@/lib/supabase/client'
import type { CategoriaServicio, Servicio } from '@/types'
import { logger } from '@/lib/logger'
import { hoyISO } from '@/lib/date-utils'

// Nota: getServiciosPorCategoria() (lectura pública SSR) vive en
// servicios-ssr.ts — ver el comentario de ese archivo. Este
// módulo solo debe contener funciones que usan el cliente de
// navegador, porque lo importan Client Components.

// ── Admin: todos los servicios (incluyendo inactivos) ─────────

export async function getAllServiciosAdmin(): Promise<(Servicio & { categoria: CategoriaServicio })[]> {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('servicios')
    .select('*, categoria:categorias_servicio(*)')
    .order('nombre')

  if (error) {
    logger.error('Error al obtener servicios admin:', error.message)
    return []
  }

  return data as (Servicio & { categoria: CategoriaServicio })[]
}

export async function getServicioById(id: string): Promise<Servicio | null> {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('servicios')
    .select('*, categoria:categorias_servicio(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Servicio
}

export async function crearServicio(
  input: Omit<Servicio, 'id' | 'created_at' | 'categoria'>
): Promise<Servicio | null> {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('servicios')
    .insert(input)
    .select()
    .single()

  if (error) {
    logger.error('Error al crear servicio:', error.message)
    return null
  }

  return data as Servicio
}

export async function actualizarServicio(
  id: string,
  input: Partial<Omit<Servicio, 'id' | 'created_at' | 'categoria'>>
): Promise<Servicio | null> {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('servicios')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar servicio:', error.message)
    return null
  }

  return data as Servicio
}

/**
 * Verifica si el servicio tiene citas futuras pendientes o confirmadas.
 * Si las tiene, solo se permite desactivar (activo = false), nunca eliminar.
 */
export async function tienesCitasFuturas(servicioId: string): Promise<boolean> {
  const supabase = createClientClient()

  const hoy = hoyISO()

  const { count } = await supabase
    .from('cita_servicios')
    .select('id', { count: 'exact', head: true })
    .eq('servicio_id', servicioId)
    .filter('cita.fecha', 'gte', hoy)
    .filter('cita.estado', 'in', '("pendiente","confirmada")')

  return (count ?? 0) > 0
}

export async function eliminarServicio(id: string): Promise<{ ok: boolean; mensaje?: string }> {
  const supabase = createClientClient()

  // Verificar citas futuras antes de eliminar
  const { count } = await supabase
    .from('cita_servicios')
    .select('id', { count: 'exact', head: true })
    .eq('servicio_id', id)

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      mensaje: 'No se puede eliminar: el servicio tiene citas asociadas. Desactívalo en su lugar.',
    }
  }

  const { error } = await supabase.from('servicios').delete().eq('id', id)

  if (error) {
    logger.error('Error al eliminar servicio:', error.message)
    return { ok: false, mensaje: error.message }
  }

  return { ok: true }
}

export async function toggleActivoServicio(id: string, activo: boolean): Promise<boolean> {
  const supabase = createClientClient()

  const { error } = await supabase
    .from('servicios')
    .update({ activo })
    .eq('id', id)

  if (error) {
    logger.error('Error al cambiar estado del servicio:', error.message)
    return false
  }

  return true
}