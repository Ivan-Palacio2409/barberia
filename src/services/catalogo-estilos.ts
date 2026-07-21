import { createClient } from '@/lib/supabase/client'
import type { CatalogoEstilo } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: catalogo_estilos
// Galería pública de inspiración del negocio. No confundir con
// estilos_referencia (Fase 4), que son imágenes privadas que el
// cliente sube para su propia cita.
// ============================================================

export async function getCatalogoEstilos(): Promise<CatalogoEstilo[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .select('*, categoria:categorias_servicio(*)')
    .order('destacado', { ascending: false })

  if (error) {
    logger.error('Error al obtener el catálogo de diseños:', error.message)
    return []
  }

  return data as CatalogoEstilo[]
}

export async function getEstilosDestacados(): Promise<CatalogoEstilo[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .select('*, categoria:categorias_servicio(*)')
    .eq('destacado', true)

  if (error) {
    logger.error('Error al obtener los diseños destacados:', error.message)
    return []
  }

  return data as CatalogoEstilo[]
}

export async function getEstilosPorCategoria(categoriaId: string): Promise<CatalogoEstilo[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .select('*, categoria:categorias_servicio(*)')
    .eq('categoria_id', categoriaId)

  if (error) {
    logger.error('Error al obtener los diseños por categoría:', error.message)
    return []
  }

  return data as CatalogoEstilo[]
}

export async function crearEstilo(
  data: Omit<CatalogoEstilo, 'id' | 'categoria'>
): Promise<CatalogoEstilo | null> {
  const supabase = createClient()

  const { data: nuevo, error } = await supabase
    .from('catalogo_estilos')
    .insert(data)
    .select()
    .single()

  if (error) {
    logger.error('Error al crear el diseño del catálogo:', error.message)
    return null
  }

  return nuevo as CatalogoEstilo
}

export async function eliminarEstilo(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('catalogo_estilos').delete().eq('id', id)

  if (error) {
    logger.error('Error al eliminar el diseño del catálogo:', error.message)
    return false
  }

  return true
}
