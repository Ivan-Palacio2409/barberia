import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { CanalNotificacion, Notificacion, TipoNotificacion } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// src/services/notificaciones-admin.ts — Fase 24
// Variantes de cliente de navegador para Client Components. Las
// variantes server-only viven en notificaciones-admin-ssr.ts — ver
// el comentario de ese archivo.
// ============================================================

export interface NotificacionConCliente extends Notificacion {
  cliente: {
    id: string
    nombre: string
    telefono: string
    email?: string
  } | null
}

export interface FiltroNotificaciones {
  estado?: 'enviado' | 'pendiente' | ''
  canal?: CanalNotificacion | ''
  tipo?: TipoNotificacion | ''
}

// ============================================================
// Fase 28 — Variantes para Client Components (cliente de browser)
// Usadas por el hook useNotificacionesAdminRealtime para refrescar
// la lista/resumen/contador cuando llega un evento Realtime, sin
// depender de las cookies de servidor.
// ============================================================

export async function getNotificacionesAdminClient(
  filtros: FiltroNotificaciones = {}
): Promise<NotificacionConCliente[]> {
  const supabase = createBrowserClient()

  let query = supabase
    .from('notificaciones')
    .select(`
      *,
      cliente:clientes ( id, nombre, telefono, email )
    `)
    .order('fecha_programada', { ascending: false })
    .limit(300)

  if (filtros.estado === 'enviado') query = query.eq('enviado', true)
  if (filtros.estado === 'pendiente') query = query.eq('enviado', false)
  if (filtros.canal) query = query.eq('canal', filtros.canal)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)

  const { data, error } = await query

  if (error) {
    logger.error('[getNotificacionesAdminClient]', error.message)
    return []
  }

  return data as unknown as NotificacionConCliente[]
}

export async function getResumenNotificacionesClient(): Promise<{
  pendientes: number
  enviadas_hoy: number
  total: number
  por_canal: { email: number; whatsapp: number; ambos: number }
}> {
  const supabase = createBrowserClient()

  const hoy = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('notificaciones')
    .select('enviado, canal, fecha_programada')

  if (error || !data) {
    return { pendientes: 0, enviadas_hoy: 0, total: 0, por_canal: { email: 0, whatsapp: 0, ambos: 0 } }
  }

  const pendientes = data.filter(n => !n.enviado).length
  const enviadas_hoy = data.filter(n => n.enviado && n.fecha_programada?.startsWith(hoy)).length
  const total = data.length

  const por_canal = { email: 0, whatsapp: 0, ambos: 0 }
  data.forEach(n => {
    const k = n.canal as keyof typeof por_canal
    if (k in por_canal) por_canal[k]++
  })

  return { pendientes, enviadas_hoy, total, por_canal }
}

export async function countNotificacionesPendientesClient(): Promise<number> {
  const supabase = createBrowserClient()

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('enviado', false)
    .lte('fecha_programada', new Date().toISOString())

  if (error) return 0
  return count ?? 0
}
