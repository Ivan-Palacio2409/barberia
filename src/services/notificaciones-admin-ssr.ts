import { createClient } from '@/lib/supabase/server'
import type { CanalNotificacion, Notificacion, TipoNotificacion } from '@/types'
import { logger } from '@/lib/logger'
import { hoyISO } from '@/lib/date-utils'

// ============================================================
// src/services/notificaciones-admin.ts — Fase 24
// Consultas server-side para el panel admin de notificaciones.
//
// Auditoría enterprise: separado de notificaciones-admin.ts porque
// ese archivo (con las variantes *Client) lo importan Client
// Components (NotificacionesAdminShell.tsx, CampanaNotificaciones.tsx),
// y mezclar next/headers ahí rompía el build de producción.
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

// Tipos que ya no se generan (no habia cron que los procesara y
// quedaban "pendientes"/"vencidos" para siempre); se excluyen del
// panel del admin por si quedan filas viejas en la base de datos.
const TIPOS_EXCLUIDOS: TipoNotificacion[] = ['recordatorio_mismo_dia', 'recordatorio_1_hora']

export async function getNotificacionesAdmin(
  filtros: FiltroNotificaciones = {}
): Promise<NotificacionConCliente[]> {
  const supabase = await createClient()

  let query = supabase
    .from('notificaciones')
    .select(`
      *,
      cliente:clientes ( id, nombre, telefono, email )
    `)
    .not('tipo', 'in', `(${TIPOS_EXCLUIDOS.join(',')})`)
    .order('fecha_programada', { ascending: false })
    .limit(300)

  if (filtros.estado === 'enviado') query = query.eq('enviado', true)
  if (filtros.estado === 'pendiente') query = query.eq('enviado', false)
  if (filtros.canal) query = query.eq('canal', filtros.canal)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)

  const { data, error } = await query

  if (error) {
    logger.error('[getNotificacionesAdmin]', error.message)
    return []
  }

  return data as unknown as NotificacionConCliente[]
}

export async function getResumenNotificaciones(): Promise<{
  pendientes: number
  enviadas_hoy: number
  total: number
  por_canal: { email: number; whatsapp: number; ambos: number }
}> {
  const supabase = await createClient()

  const hoy = hoyISO()

  const { data, error } = await supabase
    .from('notificaciones')
    .select('enviado, canal, fecha_programada')
    .not('tipo', 'in', `(${TIPOS_EXCLUIDOS.join(',')})`)

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

export async function marcarEnviadaAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'administrador') return { ok: false, error: 'Acceso denegado.' }

  const { error } = await supabase
    .from('notificaciones')
    .update({ enviado: true })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function programarNotificacionAdmin(params: {
  cliente_id: string
  tipo: TipoNotificacion
  canal: CanalNotificacion
  cita_id?: string
  fecha_programada: string
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'administrador') return { ok: false, error: 'Acceso denegado.' }

  const { error } = await supabase.from('notificaciones').insert({
    cliente_id: params.cliente_id,
    tipo: params.tipo,
    canal: params.canal,
    cita_id: params.cita_id ?? null,
    fecha_programada: params.fecha_programada,
    enviado: false,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// Para la campana del admin — solo cuenta pendientes
export async function countNotificacionesPendientes(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('enviado', false)
    .not('tipo', 'in', `(${TIPOS_EXCLUIDOS.join(',')})`)
    .lte('fecha_programada', new Date().toISOString())

  if (error) return 0
  return count ?? 0
}

// jul 2026: conteo inicial (sin parpadeo, calculado en el servidor)
// para la campana del admin reescrita como dropdown de alertas. Solo
// cuenta las 3 alertas que le importan a la administradora: nueva
// reserva, cancelacion, y nueva resena — no toda la cola de envios.
const TIPOS_ALERTA_ADMIN: TipoNotificacion[] = [
  'nueva_reserva_admin',
  'cancelacion_cita',
  'nueva_resena_admin',
]

export async function countAlertasAdminNoLeidas(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('destinatario', 'admin')
    .eq('leida', false)
    .in('tipo', TIPOS_ALERTA_ADMIN)

  if (error) return 0
  return count ?? 0
}