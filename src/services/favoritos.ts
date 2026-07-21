import { createClient } from '@/lib/supabase/client'
import type { EstiloFavorito } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: estilos_favoritos — Fase 14
// El cliente puede guardar diseños del catálogo público como
// favoritos para usarlos como inspiración en futuras reservas.
// ============================================================

export async function getFavoritosByCliente(clienteId: string): Promise<EstiloFavorito[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('estilos_favoritos')
    .select('*, catalogo_estilo:catalogo_estilos(*, categoria:categorias_servicio(*))')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error al obtener los diseños favoritos:', error.message)
    return []
  }

  return data as EstiloFavorito[]
}

export async function addFavorito(
  clienteId: string,
  catalogoEstiloId: string
): Promise<EstiloFavorito | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('estilos_favoritos')
    .insert({ cliente_id: clienteId, catalogo_estilo_id: catalogoEstiloId })
    .select()
    .single()

  if (error) {
    logger.error('Error al agregar el favorito:', error.message)
    return null
  }

  return data as EstiloFavorito
}

export async function removeFavorito(
  clienteId: string,
  catalogoEstiloId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('estilos_favoritos')
    .delete()
    .eq('cliente_id', clienteId)
    .eq('catalogo_estilo_id', catalogoEstiloId)

  if (error) {
    logger.error('Error al eliminar el favorito:', error.message)
    return false
  }

  return true
}

export async function esFavorito(
  clienteId: string,
  catalogoEstiloId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('estilos_favoritos')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('catalogo_estilo_id', catalogoEstiloId)
    .maybeSingle()

  if (error) return false
  return data !== null
}

export async function getFavoritosIds(clienteId: string): Promise<Set<string>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('estilos_favoritos')
    .select('catalogo_estilo_id')
    .eq('cliente_id', clienteId)

  if (error || !data) return new Set()
  return new Set(data.map((f) => f.catalogo_estilo_id as string))
}
