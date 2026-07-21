import { createClient } from '@/lib/supabase/client'
import type { Sugerencia } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: sugerencias — Fase 15
// ============================================================

export async function getSugerenciasByCliente(clienteId: string): Promise<Sugerencia[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sugerencias')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error al obtener las sugerencias del cliente:', error.message)
    return []
  }

  return data as Sugerencia[]
}

export async function getTodasLasSugerencias(): Promise<Sugerencia[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sugerencias')
    .select('*, cliente:clientes(id, nombre)')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error al obtener todas las sugerencias:', error.message)
    return []
  }

  return data as Sugerencia[]
}

export async function crearSugerencia(
  clienteId: string,
  mensaje: string
): Promise<Sugerencia | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sugerencias')
    .insert({ cliente_id: clienteId, mensaje })
    .select()
    .single()

  if (error) {
    logger.error('Error al crear la sugerencia:', error.message)
    throw error
  }

  return data as Sugerencia
}
