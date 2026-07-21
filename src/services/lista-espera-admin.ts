import { createClient } from '@/lib/supabase/server'
import type { EstadoListaEspera, ListaEspera } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// src/services/lista-espera-admin.ts — Fase 23
// Consultas server-side para el panel admin de lista de espera.
// ============================================================

export interface ListaEsperaConCliente extends Omit<ListaEspera, 'cliente'> {
  cliente: {
    id: string
    nombre: string
    telefono: string
    email?: string
  }
}

export async function getListaEsperaAdmin(
  estado?: EstadoListaEspera | ''
): Promise<ListaEsperaConCliente[]> {
  const supabase = await createClient()

  let query = supabase
    .from('lista_espera')
    .select(`
      *,
      cliente:clientes ( id, nombre, telefono, email )
    `)
    .order('fecha_solicitada', { ascending: true })
    .order('created_at', { ascending: true })

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query

  if (error) {
    logger.error('[getListaEsperaAdmin] Error:', error.message)
    return []
  }

  return data as unknown as ListaEsperaConCliente[]
}

export async function getResumenListaEspera(): Promise<{
  en_espera: number
  notificado: number
  convertido: number
  cancelado: number
  total: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lista_espera')
    .select('estado')

  if (error || !data) {
    return { en_espera: 0, notificado: 0, convertido: 0, cancelado: 0, total: 0 }
  }

  const counts = { en_espera: 0, notificado: 0, convertido: 0, cancelado: 0 }
  data.forEach(r => {
    const k = r.estado as keyof typeof counts
    if (k in counts) counts[k]++
  })

  return { ...counts, total: data.length }
}

export async function cambiarEstadoListaEspera(
  id: string,
  estado: EstadoListaEspera,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', adminId)
    .single()

  if (profile?.rol !== 'administrador') {
    return { ok: false, error: 'Acceso denegado.' }
  }

  const { error } = await supabase
    .from('lista_espera')
    .update({ estado })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Si notificado, registrar notificacion en la tabla
  if (estado === 'notificado') {
    // Obtener cliente_id
    const { data: fila } = await supabase
      .from('lista_espera')
      .select('cliente_id')
      .eq('id', id)
      .single()

    if (fila?.cliente_id) {
      const { error: errorNotif } = await supabase.from('notificaciones').insert({
        cliente_id: fila.cliente_id,
        tipo: 'aviso_lista_espera',
        canal: 'whatsapp',
        fecha_programada: new Date().toISOString(),
        enviado: false,
      })
      // QA fase 30 (M3): antes se ignoraba en silencio.
      if (errorNotif) {
        logger.error('[actualizarEstadoListaEspera] No se pudo registrar la notificación de aviso:', id, errorNotif.message)
      }
    }
  }

  return { ok: true }
}