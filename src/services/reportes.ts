import { createClient } from '@/lib/supabase/server'

// ============================================================
// src/services/reportes.ts — Rehecho (sin pagos/Wompi)
// Consultas de servidor para el panel de analíticas del admin.
// El "ingreso" ahora se estima a partir de precio_total de las
// citas completadas (no hay registro de pagos: se paga en el
// local). No hay desglose por método de pago.
// ============================================================

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export interface SerieDiaria {
  fecha: string      // 'YYYY-MM-DD'
  label: string       // 'D Mes'
  citas: number
  ingresos: number
}

export interface ReporteResumen {
  ingresos_mes_actual: number
  ingresos_mes_anterior: number
  variacion_porcentual: number | null
  total_citas_mes: number
  citas_completadas_mes: number
  citas_canceladas_mes: number
  citas_no_asistio_mes: number
  tasa_completadas: number
  tasa_asistencia: number
  ticket_promedio: number
  clientes_nuevos_mes: number
  total_resenas: number
  promedio_resenas: number
  serie_diaria: SerieDiaria[]                                // últimos 30 días
  distribucion_estados: { estado: string; label: string; total: number }[]
  top_servicios: { nombre: string; cantidad: number; ingresos: number }[]
}

// Fase 25 (rehecho): resumen para un rango de fechas personalizado
export interface ReporteFiltrado {
  desde: string
  hasta: string
  ingresos_periodo: number
  total_citas: number
  citas_completadas: number
  citas_canceladas: number
  citas_no_asistio: number
  tasa_completadas: number
  ticket_promedio: number
  clientes_nuevos: number
  serie_diaria: SerieDiaria[]
  top_servicios: { nombre: string; cantidad: number; ingresos: number }[]
  citas_detalle: {
    fecha: string
    hora: string
    cliente: string
    servicios: string
    estado: string
    monto: number
  }[]
}

// Fase 25: rendimiento desglosado por servicio en un periodo
export interface ServicioRendimiento {
  servicio_id: string
  servicio_nombre: string
  categoria_nombre: string
  total_citas: number
  citas_completadas: number
  ingresos_generados: number
  precio_promedio: number
  ultima_cita: string | null
}

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
}

interface CitaRow {
  fecha: string
  estado: string
  precio_total: number | string | null
}

function buildSerieDiaria(citas: CitaRow[], desde: Date, hasta: Date): SerieDiaria[] {
  const porDia: Record<string, { citas: number; ingresos: number }> = {}
  const cursor = new Date(desde)
  while (cursor <= hasta) {
    porDia[toDateStr(cursor)] = { citas: 0, ingresos: 0 }
    cursor.setDate(cursor.getDate() + 1)
  }
  for (const c of citas) {
    if (!(c.fecha in porDia)) continue
    if (c.estado === 'cancelada') continue
    porDia[c.fecha].citas += 1
    if (c.estado === 'completada') {
      porDia[c.fecha].ingresos += Number(c.precio_total ?? 0)
    }
  }
  return Object.entries(porDia).map(([fecha, v]) => {
    const d = new Date(fecha + 'T12:00:00')
    return { fecha, label: `${d.getDate()} ${MESES_ES[d.getMonth()]}`, ...v }
  })
}

// ── Reporte base del mes actual ───────────────────────────────
export async function getReporteResumen(): Promise<ReporteResumen> {
  const supabase = await createClient()

  const hoy = new Date()
  const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
  const hace30Dias = new Date(hoy)
  hace30Dias.setDate(hoy.getDate() - 29)

  const mesActualStr = toDateStr(inicioMesActual)
  const mesAnteriorStr = toDateStr(inicioMesAnterior)
  const finMesAnteriorStr = toDateStr(finMesAnterior)
  const hace30DiasStr = toDateStr(hace30Dias)
  const hoyStr = toDateStr(hoy)

  // ── Citas del mes actual (para ingresos, tasas, estados) ────
  const { data: citasMes } = await supabase
    .from('citas')
    .select('estado, precio_total')
    .gte('fecha', mesActualStr)
    .lte('fecha', hoyStr)

  const rows = (citasMes ?? []) as CitaRow[]
  const ingresos_mes_actual = rows
    .filter((c) => c.estado === 'completada')
    .reduce((acc, c) => acc + Number(c.precio_total ?? 0), 0)

  const { data: citasMesAnterior } = await supabase
    .from('citas')
    .select('estado, precio_total')
    .gte('fecha', mesAnteriorStr)
    .lte('fecha', finMesAnteriorStr)

  const ingresos_mes_anterior = ((citasMesAnterior ?? []) as CitaRow[])
    .filter((c) => c.estado === 'completada')
    .reduce((acc, c) => acc + Number(c.precio_total ?? 0), 0)

  const variacion_porcentual =
    ingresos_mes_anterior > 0
      ? Math.round(((ingresos_mes_actual - ingresos_mes_anterior) / ingresos_mes_anterior) * 100)
      : null

  const total_citas_mes = rows.length
  const citas_completadas_mes = rows.filter((c) => c.estado === 'completada').length
  const citas_canceladas_mes = rows.filter((c) => c.estado === 'cancelada').length
  const citas_no_asistio_mes = rows.filter((c) => c.estado === 'no_asistio').length
  const tasa_completadas = total_citas_mes > 0
    ? Math.round((citas_completadas_mes / total_citas_mes) * 100)
    : 0
  const conAsistenciaConocida = citas_completadas_mes + citas_no_asistio_mes
  const tasa_asistencia = conAsistenciaConocida > 0
    ? Math.round((citas_completadas_mes / conAsistenciaConocida) * 100)
    : 100
  const ticket_promedio = citas_completadas_mes > 0
    ? Math.round(ingresos_mes_actual / citas_completadas_mes)
    : 0

  const { count: clientes_nuevos_mes } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${mesActualStr}T00:00:00`)

  const { data: resenas } = await supabase
    .from('resenas')
    .select('puntuacion')

  const total_resenas = resenas?.length ?? 0
  const promedio_resenas = total_resenas > 0
    ? Math.round((resenas!.reduce((a, r) => a + r.puntuacion, 0) / total_resenas) * 10) / 10
    : 0

  // ── Serie diaria (últimos 30 días) para la gráfica de área ──
  const { data: citas30 } = await supabase
    .from('citas')
    .select('fecha, estado, precio_total')
    .gte('fecha', hace30DiasStr)
    .lte('fecha', hoyStr)

  const serie_diaria = buildSerieDiaria((citas30 ?? []) as CitaRow[], hace30Dias, hoy)

  // ── Distribución por estado (donut) ─────────────────────────
  const estadosCount: Record<string, number> = {}
  rows.forEach((c) => { estadosCount[c.estado] = (estadosCount[c.estado] ?? 0) + 1 })
  const distribucion_estados = Object.entries(estadosCount)
    .map(([estado, total]) => ({ estado, label: ESTADO_LABELS[estado] ?? estado, total }))
    .sort((a, b) => b.total - a.total)

  // ── Top 5 servicios del mes ──────────────────────────────────
  const { data: topRaw } = await supabase
    .from('cita_servicios')
    .select(`
      servicios ( nombre, precio ),
      citas!inner ( fecha, estado )
    `)
    .gte('citas.fecha', mesActualStr)
    .eq('citas.estado', 'completada')

  const servicioMap: Record<string, { cantidad: number; ingresos: number }> = {}
  ;(topRaw ?? []).forEach((r: { servicios: { nombre: string; precio: number }[] }) => {
    const nombre = r.servicios?.[0]?.nombre
    if (!nombre) return
    if (!servicioMap[nombre]) servicioMap[nombre] = { cantidad: 0, ingresos: 0 }
    servicioMap[nombre].cantidad++
    servicioMap[nombre].ingresos += Number(r.servicios?.[0]?.precio ?? 0)
  })

  const top_servicios = Object.entries(servicioMap)
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)

  return {
    ingresos_mes_actual,
    ingresos_mes_anterior,
    variacion_porcentual,
    total_citas_mes,
    citas_completadas_mes,
    citas_canceladas_mes,
    citas_no_asistio_mes,
    tasa_completadas,
    tasa_asistencia,
    ticket_promedio,
    clientes_nuevos_mes: clientes_nuevos_mes ?? 0,
    total_resenas,
    promedio_resenas,
    serie_diaria,
    distribucion_estados,
    top_servicios,
  }
}

// ── Reporte con rango de fechas personalizado ──────────────────
export async function getReporteConFiltros(
  desde: string,
  hasta: string
): Promise<ReporteFiltrado> {
  const supabase = await createClient()

  const { data: citasRaw } = await supabase
    .from('citas')
    .select(`
      fecha, hora_inicio, estado, precio_total,
      cliente:clientes ( nombre ),
      cita_servicios ( servicios ( nombre ) )
    `)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })

  interface RawRow {
    fecha: string
    hora_inicio: string
    estado: string
    precio_total: number | string | null
    cliente: { nombre: string }[]
    cita_servicios: { servicios: { nombre: string }[] }[]
  }

  const rows = (citasRaw ?? []) as unknown as RawRow[]

  const ingresos_periodo = rows
    .filter((c) => c.estado === 'completada')
    .reduce((a, c) => a + Number(c.precio_total ?? 0), 0)

  const total_citas = rows.length
  const citas_completadas = rows.filter((c) => c.estado === 'completada').length
  const citas_canceladas = rows.filter((c) => c.estado === 'cancelada').length
  const citas_no_asistio = rows.filter((c) => c.estado === 'no_asistio').length
  const tasa_completadas = total_citas > 0
    ? Math.round((citas_completadas / total_citas) * 100)
    : 0
  const ticket_promedio = citas_completadas > 0
    ? Math.round(ingresos_periodo / citas_completadas)
    : 0

  const { count: clientes_nuevos } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${desde}T00:00:00`)
    .lte('created_at', `${hasta}T23:59:59`)

  const serie_diaria = buildSerieDiaria(
    rows.map((r) => ({ fecha: r.fecha, estado: r.estado, precio_total: r.precio_total })),
    new Date(desde + 'T12:00:00'),
    new Date(hasta + 'T12:00:00'),
  )

  const { data: topRaw } = await supabase
    .from('cita_servicios')
    .select(`
      servicios ( nombre, precio ),
      citas!inner ( fecha, estado )
    `)
    .gte('citas.fecha', desde)
    .lte('citas.fecha', hasta)
    .eq('citas.estado', 'completada')

  const servicioMap: Record<string, { cantidad: number; ingresos: number }> = {}
  ;(topRaw ?? []).forEach((r: { servicios: { nombre: string; precio: number }[] }) => {
    const nombre = r.servicios?.[0]?.nombre
    if (!nombre) return
    if (!servicioMap[nombre]) servicioMap[nombre] = { cantidad: 0, ingresos: 0 }
    servicioMap[nombre].cantidad++
    servicioMap[nombre].ingresos += Number(r.servicios?.[0]?.precio ?? 0)
  })

  const top_servicios = Object.entries(servicioMap)
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10)

  const citas_detalle = rows.map((r) => ({
    fecha: r.fecha,
    hora: r.hora_inicio?.slice(0, 5) ?? '',
    cliente: r.cliente?.[0]?.nombre ?? '-',
    servicios: (r.cita_servicios ?? []).flatMap((cs) => cs.servicios?.map((s) => s.nombre) ?? []).join(', '),
    estado: ESTADO_LABELS[r.estado] ?? r.estado,
    monto: Number(r.precio_total ?? 0),
  }))

  return {
    desde,
    hasta,
    ingresos_periodo,
    total_citas,
    citas_completadas,
    citas_canceladas,
    citas_no_asistio,
    tasa_completadas,
    ticket_promedio,
    clientes_nuevos: clientes_nuevos ?? 0,
    serie_diaria,
    top_servicios,
    citas_detalle,
  }
}

// ── Rendimiento por servicio en un periodo ──────────────────────
export async function getReportePorServicio(
  desde: string,
  hasta: string
): Promise<ServicioRendimiento[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('cita_servicios')
    .select(`
      servicios (
        id, nombre, precio,
        categorias_servicio ( nombre )
      ),
      citas!inner ( fecha, estado )
    `)
    .gte('citas.fecha', desde)
    .lte('citas.fecha', hasta)

  const mapa: Record<string, ServicioRendimiento> = {}

  interface RawServicioRow {
    servicios: { id: string; nombre: string; precio: number; categorias_servicio: { nombre: string }[] }[]
    citas: { fecha: string; estado: string }[]
  }

  ;(data ?? []).forEach((r: RawServicioRow) => {
    const s = r.servicios?.[0]
    if (!s) return
    const cita = r.citas?.[0]
    if (!cita) return

    if (!mapa[s.id]) {
      mapa[s.id] = {
        servicio_id: s.id,
        servicio_nombre: s.nombre,
        categoria_nombre: s.categorias_servicio?.[0]?.nombre ?? '-',
        total_citas: 0,
        citas_completadas: 0,
        ingresos_generados: 0,
        precio_promedio: Number(s.precio ?? 0),
        ultima_cita: null,
      }
    }

    mapa[s.id].total_citas++
    if (cita.estado === 'completada') {
      mapa[s.id].citas_completadas++
      mapa[s.id].ingresos_generados += Number(s.precio ?? 0)
    }
    if (!mapa[s.id].ultima_cita || cita.fecha > mapa[s.id].ultima_cita!) {
      mapa[s.id].ultima_cita = cita.fecha
    }
  })

  return Object.values(mapa).sort((a, b) => b.total_citas - a.total_citas)
}
