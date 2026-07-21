import { createClient } from '@/lib/supabase/client'
import type { DiaBloqueado, HorarioEspecial, HorarioTrabajo } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: horarios_trabajo, dias_bloqueados y horarios_especiales
//
// Las LECTURAS siguen yendo directo desde el navegador (son
// públicas, cualquiera puede verlas — nunca dieron problema).
//
// Las ESCRITURAS (crear/actualizar/eliminar) pasan por rutas de
// API en /api/admin/*, que corren en el servidor y validan la
// sesión leyendo las cookies de la petición HTTP directamente
// (igual que middleware.ts). Antes se escribía directo desde el
// navegador con el cliente de Supabase, y esas escrituras venían
// fallando de forma intermitente con 401 / "row-level security
// policy" — el problema nunca se aisló con certeza (se
// investigaron Service Worker, cookies sobre IP de LAN,
// expiración de token) pero siempre apuntaba a algo del lado de
// la sesión del navegador. Moviendo la escritura al servidor se
// evita depender de eso.
// ============================================================

async function llamarApiAdmin<T>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T | null> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  let json: { data?: T; error?: string; ok?: boolean } | null = null
  try {
    json = await res.json()
  } catch {
    // respuesta sin body (no debería pasar, pero no truena por esto)
  }

  if (!res.ok) {
    logger.error(`Error en ${method} ${url}:`, json?.error ?? `HTTP ${res.status}`)
    return null
  }

  return (json?.data ?? (json as unknown as T)) ?? null
}

export async function getHorariosTrabajo(soloActivos = true): Promise<HorarioTrabajo[]> {
  const supabase = createClient()

  let query = supabase
    .from('horarios_trabajo')
    .select('*')
    .order('dia_semana', { ascending: true })
    .order('bloque', { ascending: true })

  if (soloActivos) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Error al obtener los horarios de trabajo:', error.message)
    return []
  }

  return data as HorarioTrabajo[]
}

export async function getBloquesPorDia(diaSemana: number): Promise<HorarioTrabajo[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('horarios_trabajo')
    .select('*')
    .eq('dia_semana', diaSemana)
    .eq('activo', true)
    .order('bloque', { ascending: true })

  if (error) {
    logger.error('Error al obtener los bloques del día:', error.message)
    return []
  }

  return data as HorarioTrabajo[]
}

export async function actualizarHorario(
  id: string,
  data: Partial<Pick<HorarioTrabajo, 'hora_inicio' | 'hora_fin' | 'activo'>>
): Promise<HorarioTrabajo | null> {
  return llamarApiAdmin<HorarioTrabajo>(`/api/admin/horarios-trabajo/${id}`, 'PATCH', data)
}

/**
 * Crea (o reactiva) el bloque de mañana o tarde para un día
 * específico. Se usa cuando el admin activa un bloque que todavía
 * no existía en la base de datos (ej. agregar jornada de tarde a
 * un día que solo tenía mañana).
 */
export async function crearBloqueHorario(payload: {
  dia_semana: number
  bloque: 'manana' | 'tarde'
  hora_inicio: string
  hora_fin: string
}): Promise<HorarioTrabajo | null> {
  return llamarApiAdmin<HorarioTrabajo>('/api/admin/horarios-trabajo', 'POST', payload)
}

export async function eliminarBloqueHorario(id: string): Promise<boolean> {
  const res = await llamarApiAdmin<{ ok: boolean }>(
    `/api/admin/horarios-trabajo/${id}`,
    'DELETE'
  )
  return res !== null
}

// ── Días bloqueados ───────────────────────────────────────────

export async function getDiasBloqueados(): Promise<DiaBloqueado[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dias_bloqueados')
    .select('*')
    .order('fecha', { ascending: true })

  if (error) {
    logger.error('Error al obtener los días bloqueados:', error.message)
    return []
  }

  return data as DiaBloqueado[]
}

export async function esFechaBloqueada(fecha: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dias_bloqueados')
    .select('id')
    .eq('fecha', fecha)
    .maybeSingle()

  if (error) {
    logger.error('Error al verificar si la fecha está bloqueada:', error.message)
    return false
  }

  return data !== null
}

export async function bloquearFecha(
  fecha: string,
  motivo?: string
): Promise<DiaBloqueado | null> {
  return llamarApiAdmin<DiaBloqueado>('/api/admin/dias-bloqueados', 'POST', { fecha, motivo })
}

export async function desbloquearFecha(id: string): Promise<boolean> {
  const res = await llamarApiAdmin<{ ok: boolean }>(`/api/admin/dias-bloqueados/${id}`, 'DELETE')
  return res !== null
}

// ── Horarios especiales ───────────────────────────────────────

export async function getHorariosEspeciales(): Promise<HorarioEspecial[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('horarios_especiales')
    .select('*')
    .order('fecha', { ascending: true })

  if (error) {
    logger.error('Error al obtener horarios especiales:', error.message)
    return []
  }

  return data as HorarioEspecial[]
}

export async function crearHorarioEspecial(
  payload: Pick<HorarioEspecial, 'fecha' | 'hora_inicio' | 'hora_fin' | 'motivo'>
): Promise<HorarioEspecial | null> {
  return llamarApiAdmin<HorarioEspecial>('/api/admin/horarios-especiales', 'POST', payload)
}

export async function actualizarHorarioEspecial(
  id: string,
  payload: Partial<Pick<HorarioEspecial, 'hora_inicio' | 'hora_fin' | 'motivo'>>
): Promise<HorarioEspecial | null> {
  return llamarApiAdmin<HorarioEspecial>(`/api/admin/horarios-especiales/${id}`, 'PATCH', payload)
}

export async function eliminarHorarioEspecial(id: string): Promise<boolean> {
  const res = await llamarApiAdmin<{ ok: boolean }>(
    `/api/admin/horarios-especiales/${id}`,
    'DELETE'
  )
  return res !== null
}