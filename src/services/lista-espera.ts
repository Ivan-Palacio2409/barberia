import { createClient } from '@/lib/supabase/client'
import type { EstadoListaEspera, ListaEspera } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: lista_espera — Fase 16
// Nota: crearClienteEInscribirse() (invitados, server-only) vive
// en lista-espera-ssr.ts — ver el comentario de ese archivo. Este
// módulo solo debe contener funciones de cliente de navegador,
// porque lo importan Client Components.
// ============================================================

export async function getListaEsperaByCliente(clienteId: string): Promise<ListaEspera[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lista_espera')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error al obtener la lista de espera del cliente:', error.message)
    return []
  }

  return data as ListaEspera[]
}

export async function getListaEsperaPorFecha(fecha: string): Promise<ListaEspera[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lista_espera')
    .select('*, cliente:clientes(*)')
    .eq('fecha_solicitada', fecha)
    .eq('estado', 'en_espera')
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Error al obtener la lista de espera de la fecha:', error.message)
    return []
  }

  return data as ListaEspera[]
}

// ── Fase 16: inscripción pública ─────────────────────────────

export interface InscribirseParams {
  cliente_id: string
  fecha_solicitada: string
  servicios_deseados?: string
}

export async function inscribirseListaEspera(
  params: InscribirseParams
): Promise<ListaEspera | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lista_espera')
    .insert({
      cliente_id: params.cliente_id,
      fecha_solicitada: params.fecha_solicitada,
      servicios_deseados: params.servicios_deseados ?? null,
    })
    .select()
    .single()

  if (error) {
    logger.error('Error al inscribirse en la lista de espera:', error.message)
    throw error
  }

  return data as ListaEspera
}

export async function cancelarInscripcion(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('lista_espera')
    .update({ estado: 'cancelado' })
    .eq('id', id)

  if (error) {
    logger.error('Error al cancelar inscripción:', error.message)
    return false
  }

  return true
}

export async function actualizarEstadoListaEspera(
  id: string,
  estado: EstadoListaEspera
): Promise<ListaEspera | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lista_espera')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar estado:', error.message)
    return null
  }

  return data as ListaEspera
}
