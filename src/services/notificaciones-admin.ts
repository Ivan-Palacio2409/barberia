import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { CanalNotificacion, Notificacion, TipoNotificacion } from '@/types'
import { logger } from '@/lib/logger'
import { hoyISO } from '@/lib/date-utils'

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

// Tipos que ya no se generan (no habia cron que los procesara y
// quedaban "pendientes"/"vencidos" para siempre); se excluyen del
// panel del admin por si quedan filas viejas en la base de datos.
const TIPOS_EXCLUIDOS: TipoNotificacion[] = ['recordatorio_mismo_dia', 'recordatorio_1_hora']

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
    .not('tipo', 'in', `(${TIPOS_EXCLUIDOS.join(',')})`)
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

export async function countNotificacionesPendientesClient(): Promise<number> {
  const supabase = createBrowserClient()

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('enviado', false)
    .not('tipo', 'in', `(${TIPOS_EXCLUIDOS.join(',')})`)
    .lte('fecha_programada', new Date().toISOString())

  if (error) return 0
  return count ?? 0
}

// ============================================================
// Campana de alertas del admin (jul 2026)
// A diferencia de countNotificacionesPendientesClient (que cuenta
// TODA la cola de envios pendientes: recordatorios, confirmaciones,
// etc. — util para la pagina de gestion /admin/notificaciones), la
// campana del navbar admin ahora solo debe avisar de 3 eventos:
// nueva reserva, cancelacion de una reserva, y nueva resena. El
// estado "leida" se persiste en la base de datos (columna
// notificaciones.leida, migracion 042) para que no se reinicie al
// recargar la pagina ni al cerrar sesion.
// ============================================================

export const TIPOS_ALERTA_ADMIN = [
  'nueva_reserva_admin',
  'cancelacion_cita',
  'nueva_resena_admin',
] as const

export interface AlertaAdmin {
  id: string
  tipo: string
  fecha_programada: string
  leida: boolean
  cliente: { id: string; nombre: string } | null
}

export async function getAlertasAdminClient(limite = 10): Promise<AlertaAdmin[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, tipo, fecha_programada, leida, cliente:clientes(id, nombre)')
    .eq('destinatario', 'admin')
    .in('tipo', TIPOS_ALERTA_ADMIN)
    .order('fecha_programada', { ascending: false })
    .limit(limite)

  if (error) {
    logger.error('[getAlertasAdminClient]', error.message)
    return []
  }

  return (data ?? []) as unknown as AlertaAdmin[]
}

export async function countAlertasAdminNoLeidasClient(): Promise<number> {
  const supabase = createBrowserClient()

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('destinatario', 'admin')
    .eq('leida', false)
    .in('tipo', TIPOS_ALERTA_ADMIN)

  if (error) return 0
  return count ?? 0
}

// Marca como leidas todas las alertas del admin que esten sin leer.
// Se llama al abrir la campana; queda guardado en la base de datos,
// asi que no vuelve a marcar "hay notificaciones" hasta que llegue
// una alerta nueva de verdad.
export async function marcarAlertasAdminLeidasClient(): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('destinatario', 'admin')
    .eq('leida', false)
    .in('tipo', TIPOS_ALERTA_ADMIN)

  if (error) {
    logger.error('[marcarAlertasAdminLeidasClient]', error.message)
  }
}