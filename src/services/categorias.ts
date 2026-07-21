import { createClient } from '@/lib/supabase/client'
import type { CategoriaServicio } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: categorias_servicio
// ============================================================

export async function getCategorias(): Promise<CategoriaServicio[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categorias_servicio')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    logger.error('Error al obtener las categorías:', error.message)
    return []
  }

  return data as CategoriaServicio[]
}

export async function getCategoriaById(id: string): Promise<CategoriaServicio | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categorias_servicio')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error al obtener la categoría:', error.message)
    return null
  }

  return data as CategoriaServicio
}
