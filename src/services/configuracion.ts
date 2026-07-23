import { createClient } from '@/lib/supabase/client'
import type { ConfiguracionNegocio } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: configuracion_negocio
// Tabla de fila única — siempre se hace SELECT/UPDATE, nunca INSERT.
// ============================================================

export async function getConfiguracion(): Promise<ConfiguracionNegocio | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    logger.error('Error al obtener configuración:', error.message)
    return null
  }

  return data as ConfiguracionNegocio
}

export async function actualizarConfiguracion(
  id: string,
  payload: Partial<Omit<ConfiguracionNegocio, 'id' | 'updated_at'>>
): Promise<{ data: ConfiguracionNegocio | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('configuracion_negocio')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar configuración:', error.message, error.code)
    return { data: null, error: error.message }
  }

  return { data: data as ConfiguracionNegocio, error: null }
}