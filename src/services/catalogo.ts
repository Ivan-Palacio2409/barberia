// ============================================================
// services/catalogo.ts — Fase 20
// CRUD completo del catálogo de diseños para admin.
// Reemplaza y amplía catalogo-estilos.ts (que se mantiene para
// compatibilidad con el portal público).
// ============================================================

import { createClient } from '@/lib/supabase/client'
import type { CatalogoEstilo, CategoriaServicio } from '@/types'
import { logger } from '@/lib/logger'

export type CatalogoEstiloConCategoria = CatalogoEstilo & { categoria: CategoriaServicio }

export async function getAllEstilosAdmin(): Promise<CatalogoEstiloConCategoria[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .select('*, categoria:categorias_servicio(*)')
    .order('destacado', { ascending: false })
    .order('titulo')

  if (error) {
    logger.error('Error al obtener catálogo admin:', error.message)
    return []
  }

  return data as CatalogoEstiloConCategoria[]
}

export async function getEstiloById(id: string): Promise<CatalogoEstiloConCategoria | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .select('*, categoria:categorias_servicio(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as CatalogoEstiloConCategoria
}

export async function crearEstiloAdmin(
  input: Omit<CatalogoEstilo, 'id' | 'categoria'>
): Promise<CatalogoEstilo | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .insert(input)
    .select()
    .single()

  if (error) {
    logger.error('Error al crear diseño:', error.message)
    return null
  }

  return data as CatalogoEstilo
}

export async function actualizarEstiloAdmin(
  id: string,
  input: Partial<Omit<CatalogoEstilo, 'id' | 'categoria'>>
): Promise<CatalogoEstilo | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('catalogo_estilos')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar diseño:', error.message)
    return null
  }

  return data as CatalogoEstilo
}

export async function eliminarEstiloAdmin(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('catalogo_estilos').delete().eq('id', id)

  if (error) {
    logger.error('Error al eliminar diseño:', error.message)
    return false
  }

  return true
}

export async function toggleDestacadoEstilo(id: string, destacado: boolean): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('catalogo_estilos')
    .update({ destacado })
    .eq('id', id)

  if (error) {
    logger.error('Error al cambiar destacado:', error.message)
    return false
  }

  return true
}
