import { createClient } from '@/lib/supabase/server'
import type { CategoriaServicio, CatalogoEstilo, Resena, Servicio } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: home — datos para la página de inicio
// Todos los métodos usan el cliente de server (cookies SSR).
// ============================================================

/** Servicios activos agrupados por categoría */
export async function getServiciosPorCategoriaHome(): Promise<
  (CategoriaServicio & { servicios: Servicio[] })[]
> {
  const supabase = await createClient()

  const { data: categorias, error: catError } = await supabase
    .from('categorias_servicio')
    .select('id, nombre')
    .order('nombre', { ascending: true })

  if (catError || !categorias) return []

  const { data: servicios, error: srvError } = await supabase
    .from('servicios')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (srvError || !servicios) return []

  return categorias
    .map((cat) => ({
      ...cat,
      servicios: servicios.filter((s) => s.categoria_id === cat.id) as Servicio[],
    }))
    .filter((cat) => cat.servicios.length > 0)
}

/** Diseños del catálogo marcados como destacados */
export async function getEstilosDestacadosHome(limite = 8): Promise<CatalogoEstilo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .select('*, categoria:categorias_servicio(*)')
    .eq('destacado', true)
    .limit(limite)

  if (error) {
    logger.error('Error al obtener diseños destacados:', error.message)
    return []
  }

  return data as CatalogoEstilo[]
}

/** Últimas N reseñas con datos del cliente */
export async function getResenasDestacadasHome(limite = 5): Promise<Resena[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('resenas')
    .select('*, cliente:clientes(nombre)')
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) {
    logger.error('Error al obtener reseñas:', error.message)
    return []
  }

  return data as Resena[]
}

/** Promedio de calificación de todas las reseñas */
export async function getPromedioHome(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('resenas').select('puntuacion')

  if (error || !data || data.length === 0) return 0

  const suma = data.reduce((acc, r) => acc + r.puntuacion, 0)
  return Math.round((suma / data.length) * 10) / 10
}
