import { createClient } from '@/lib/supabase/server'
import type { CatalogoEstilo, CategoriaServicio } from '@/types'
import { logger } from '@/lib/logger'

export type EstiloConCategoria = CatalogoEstilo & {
  categoria: Pick<CategoriaServicio, 'id' | 'nombre'> | null
}

export interface CatalogoResult {
  estilos: EstiloConCategoria[]
  categorias: Pick<CategoriaServicio, 'id' | 'nombre'>[]
}

/**
 * Devuelve todos los diseños del catálogo público junto con
 * la lista de categorías para los filtros de la galería.
 */
export async function getCatalogoConCategorias(): Promise<CatalogoResult> {
  const supabase = await createClient()

  const [{ data: estilos, error: dErr }, { data: categorias, error: cErr }] = await Promise.all([
    supabase
      .from('catalogo_estilos')
      .select('*, categoria:categorias_servicio(id, nombre)')
      .order('created_at', { ascending: false }),
    supabase
      .from('categorias_servicio')
      .select('id, nombre')
      .order('nombre'),
  ])

  if (dErr || cErr) {
    logger.error('Error al obtener catálogo:', dErr?.message ?? cErr?.message)
    return { estilos: [], categorias: [] }
  }

  return {
    estilos: (estilos ?? []) as EstiloConCategoria[],
    categorias: (categorias ?? []) as Pick<CategoriaServicio, 'id' | 'nombre'>[],
  }
}
