import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, CitaDashboard, TopServicio } from '@/types'

// ============================================================
// src/services/dashboard.ts — Fase 17 (rehecho: sin pagos)
// Consultas de servidor para el dashboard administrativo.
// Ya no rastrea ingresos/pagos: solo métricas operativas de citas
// (volumen, asistencia, servicios más pedidos, clientes nuevos).
// Solo se ejecuta en Server Components / Server Actions.
// ============================================================

// ── Fecha YYYY-MM-DD ─────────────────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── Normaliza relaciones de Supabase ─────────────────────────
// Cuando una relación es de muchos-a-uno, Supabase la devuelve
// como objeto ({ nombre: '...' }); cuando es de uno-a-muchos, como
// arreglo ([{ nombre: '...' }]). El shape puede variar según cómo
// Postgres/PostgREST infiera la cardinalidad de la FK, así que esta
// función siempre devuelve un arreglo, sin importar cuál llegó.
function toArray<T>(rel: T | T[] | null | undefined): T[] {
  if (rel == null) return []
  return Array.isArray(rel) ? rel : [rel]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const hoy = new Date()
  const hoyStr = toDateStr(hoy)

  // Inicio de semana (últimos 7 días)
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(hoy.getDate() - 6)
  const inicioSemanaStr = toDateStr(inicioSemana)

  // Inicio de mes
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesStr = toDateStr(inicioMes)

  // ── Citas del día ─────────────────────────────────────────
  const { data: citasRaw } = await supabase
    .from('citas')
    .select(`
      id,
      hora_inicio,
      hora_fin,
      estado,
      precio_total,
      clientes ( nombre ),
      cita_servicios (
        servicios ( nombre )
      )
    `)
    .eq('fecha', hoyStr)
    .neq('estado', 'cancelada')
    .order('hora_inicio', { ascending: true })

  interface RawCitaHoyRow {
    id: string
    hora_inicio: string
    hora_fin: string
    estado: string
    precio_total: number | string | null
    clientes: { nombre: string } | { nombre: string }[] | null
    cita_servicios: { servicios: { nombre: string } | { nombre: string }[] | null }[] | null
  }

  const citas_hoy: CitaDashboard[] = (citasRaw ?? []).map((c: RawCitaHoyRow) => ({
    id: c.id,
    hora_inicio: c.hora_inicio,
    hora_fin: c.hora_fin,
    estado: c.estado as CitaDashboard['estado'],
    cliente_nombre: toArray(c.clientes)[0]?.nombre ?? 'Sin nombre',
    servicios_nombres: toArray(c.cita_servicios)
      .flatMap((cs) => toArray(cs.servicios).map((s) => s.nombre))
      .filter(Boolean),
    precio_total: Number(c.precio_total ?? 0),
  }))

  // ── Próxima cita ─────────────────────────────────────────
  const ahora = new Date().toTimeString().slice(0, 5)
  const proxima_cita: CitaDashboard | null =
    citas_hoy.find(
      (c) => c.hora_inicio > ahora && (c.estado === 'pendiente' || c.estado === 'confirmada')
    ) ?? null

  // ── Conteo de citas semana / mes ──────────────────────────
  const { count: citas_semana_count } = await supabase
    .from('citas')
    .select('id', { count: 'exact', head: true })
    .neq('estado', 'cancelada')
    .gte('fecha', inicioSemanaStr)
    .lte('fecha', hoyStr)

  const { count: citas_mes_count } = await supabase
    .from('citas')
    .select('id', { count: 'exact', head: true })
    .neq('estado', 'cancelada')
    .gte('fecha', inicioMesStr)
    .lte('fecha', hoyStr)

  // ── Tasa de asistencia del mes (completadas vs completadas+no_asistio) ──
  const { data: asistenciaMes } = await supabase
    .from('citas')
    .select('estado')
    .in('estado', ['completada', 'no_asistio'])
    .gte('fecha', inicioMesStr)
    .lte('fecha', hoyStr)

  const totalConAsistenciaConocida = (asistenciaMes ?? []).length
  const totalAsistio = (asistenciaMes ?? []).filter((c) => c.estado === 'completada').length
  const tasa_asistencia_mes = totalConAsistenciaConocida > 0
    ? Math.round((totalAsistio / totalConAsistenciaConocida) * 100)
    : 100

  // ── Top 3 servicios del mes ──────────────────────────────
  const { data: topRaw } = await supabase
    .from('cita_servicios')
    .select(`
      servicios ( nombre ),
      citas!inner ( fecha, estado )
    `)
    .gte('citas.fecha', inicioMesStr)
    .eq('citas.estado', 'completada')

  const counts: Record<string, number> = {}
  ;(topRaw ?? []).forEach((r: { servicios: { nombre: string } | { nombre: string }[] | null }) => {
    const nombre = toArray(r.servicios)[0]?.nombre
    if (nombre) counts[nombre] = (counts[nombre] ?? 0) + 1
  })

  const top_servicios: TopServicio[] = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))

  // ── Clientes nuevos del mes ──────────────────────────────
  const { count: clientes_nuevos_mes } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${inicioMesStr}T00:00:00`)

  // ── Cancelaciones / inasistencias últimos 7 días ─────────
  const { count: cancelaciones_semana } = await supabase
    .from('citas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'cancelada')
    .gte('fecha', inicioSemanaStr)

  const { count: no_asistio_semana } = await supabase
    .from('citas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'no_asistio')
    .gte('fecha', inicioSemanaStr)

  return {
    citas_hoy_count: citas_hoy.length,
    citas_semana_count: citas_semana_count ?? 0,
    citas_mes_count: citas_mes_count ?? 0,
    tasa_asistencia_mes,
    citas_hoy,
    proxima_cita,
    top_servicios,
    clientes_nuevos_mes: clientes_nuevos_mes ?? 0,
    cancelaciones_semana: cancelaciones_semana ?? 0,
    no_asistio_semana: no_asistio_semana ?? 0,
  }
}

// ── Confirmar cita (acción rápida desde dashboard) ──────────
export async function confirmarCitaAdmin(citaId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('citas')
    .update({ estado: 'confirmada' })
    .eq('id', citaId)
    .eq('estado', 'pendiente')
  if (error) throw new Error(error.message)
}

// ── Completar cita (acción rápida desde dashboard) ──────────
export async function completarCitaAdmin(citaId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('citas')
    .update({ estado: 'completada' })
    .eq('id', citaId)
    .in('estado', ['pendiente', 'confirmada'])
  if (error) throw new Error(error.message)
}