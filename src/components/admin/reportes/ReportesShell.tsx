'use client'

import { useState, useTransition } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { ReporteResumen, ReporteFiltrado, ServicioRendimiento } from '@/services/reportes'
import { fetchReporteConFiltros, fetchReportePorServicio } from '@/app/actions/reportes'
import { objectsToCSV, descargarCSV } from '@/lib/export/csv'

// ============================================================
// ReportesShell.tsx — Rehecho (estilo panel de analiticas
// ZoeLandy, sin pagos/Wompi): KPIs de citas + graficas reales
// con Recharts (area, barras, dona) en vez de revenue/pagos.
// ============================================================

interface ReportesShellProps {
  reporte: ReporteResumen
}

const COLORS = ['#8b6f47', '#c9a769', '#5c7a63', '#a85751', '#4a6fa5']
const ESTADO_COLORS: Record<string, string> = {
  completada: '#5c7a63',
  confirmada: '#4a6fa5',
  pendiente: '#c9a769',
  cancelada: '#a85751',
  no_asistio: '#9a9a9a',
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function inicioMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function KpiCard({ icon, label, value, sub, subClass }: { icon: React.ReactNode; label: string; value: string; sub?: string; subClass?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subClass ?? 'text-muted-foreground'}`}>{sub}</p>}
    </div>
  )
}

// ── Tabla de rendimiento por servicio ───────────────────────────
function TablaServicios({ servicios }: { servicios: ServicioRendimiento[] }) {
  if (servicios.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">Sin datos en este periodo.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
            <th className="px-4 py-3">Servicio</th>
            <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
            <th className="px-4 py-3 text-right">Citas</th>
            <th className="px-4 py-3 text-right">Completadas</th>
            <th className="px-4 py-3 text-right">Ingresos</th>
            <th className="px-4 py-3 hidden lg:table-cell">Ultima cita</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {servicios.map((s) => (
            <tr key={s.servicio_id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-medium text-foreground">{s.servicio_nombre}</td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.categoria_nombre}</td>
              <td className="px-4 py-3 text-right">{s.total_citas}</td>
              <td className="px-4 py-3 text-right text-green-600">{s.citas_completadas}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCOP(s.ingresos_generados)}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                {s.ultima_cita
                  ? new Date(s.ultima_cita).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Shell principal ───────────────────────────────────────────
export function ReportesShell({ reporte }: ReportesShellProps) {
  const {
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
    clientes_nuevos_mes,
    total_resenas,
    promedio_resenas,
    serie_diaria,
    distribucion_estados,
    top_servicios,
  } = reporte

  const varPositiva = variacion_porcentual !== null && variacion_porcentual >= 0

  const [tabActiva, setTabActiva] = useState<'mes' | 'filtros' | 'servicios'>('mes')
  const [desde, setDesde] = useState(inicioMes())
  const [hasta, setHasta] = useState(hoy())
  const [reporteFiltrado, setReporteFiltrado] = useState<ReporteFiltrado | null>(null)
  const [servicios, setServicios] = useState<ServicioRendimiento[] | null>(null)
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const aplicarFiltros = () => {
    setErrorFiltros(null)
    startTransition(async () => {
      try {
        const [rf, sv] = await Promise.all([
          fetchReporteConFiltros(desde, hasta),
          fetchReportePorServicio(desde, hasta),
        ])
        setReporteFiltrado(rf)
        setServicios(sv)
        setTabActiva('filtros')
      } catch (e) {
        // QA jul 2026: antes, si la llamada a la Server Action fallaba
        // (red, timeout, etc.), la excepcion no controlada tumbaba
        // toda la pagina a la pantalla de error generica. Ahora se
        // muestra un mensaje inline y se puede reintentar sin perder
        // el resto del panel.
        setErrorFiltros('No se pudieron cargar los datos del periodo. Intenta de nuevo.')
      }
    })
  }

  const exportarCSVCitas = () => {
    if (!reporteFiltrado) return
    const rows = reporteFiltrado.citas_detalle.map(c => ({
      'Fecha': c.fecha,
      'Hora': c.hora,
      'Cliente': c.cliente,
      'Servicios': c.servicios,
      'Estado': c.estado,
      'Monto (COP)': c.monto,
    }))
    descargarCSV(objectsToCSV(rows), `forma-citas-${desde}_${hasta}.csv`)
  }

  const exportarCSVSerieMes = () => {
    const rows = serie_diaria.map(d => ({
      'Dia': d.label,
      'Citas': d.citas,
      'Ingresos (COP)': d.ingresos,
    }))
    descargarCSV(objectsToCSV(rows), `forma-serie-${hoy()}.csv`)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analiticas del negocio: volumen de citas, asistencia y servicios mas pedidos.
          </p>
        </div>
      </div>

      {/* Selector de rango + boton aplicar */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          Filtrar por periodo
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={e => setDesde(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={hasta}
              min={desde}
              max={hoy()}
              onChange={e => setHasta(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={aplicarFiltros}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <IconFilter />
            {isPending ? 'Cargando...' : 'Aplicar filtros'}
          </button>
        </div>
        {errorFiltros && (
          <p className="text-xs text-destructive mt-2">{errorFiltros}</p>
        )}
      </div>

      {/* Tabs — un solo control para cambiar de vista: "Mes actual"
          muestra el resumen del mes en curso, "Periodo personalizado"
          se activa solo al presionar "Aplicar filtros", y "Por
          servicio" el desglose por servicio del mismo periodo. */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'mes', label: 'Mes actual' },
          { key: 'filtros', label: reporteFiltrado ? `Periodo (${desde} — ${hasta})` : 'Periodo personalizado' },
          { key: 'servicios', label: 'Por servicio' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setTabActiva(tab.key as typeof tabActiva)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Mes actual ────────────────────────────────────── */}
      {tabActiva === 'mes' && (
        <div className="space-y-6">
          {/* KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
              label="Ingresos del mes"
              value={formatCOP(ingresos_mes_actual)}
              sub={variacion_porcentual !== null ? `${varPositiva ? '+' : ''}${variacion_porcentual}% vs mes anterior` : `Anterior: ${formatCOP(ingresos_mes_anterior)}`}
              subClass={varPositiva ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}
            />
            <KpiCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
              label="Citas del mes"
              value={String(total_citas_mes)}
              sub={`${citas_completadas_mes} completadas · ${citas_canceladas_mes} canceladas · ${citas_no_asistio_mes} no-show`}
            />
            <KpiCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
              label="Tasa de asistencia"
              value={`${tasa_asistencia}%`}
              sub={`Ticket promedio: ${formatCOP(ticket_promedio)} · ${tasa_completadas}% completadas`}
              subClass={tasa_asistencia >= 80 ? 'text-green-600' : 'text-amber-600'}
            />
            <KpiCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
              label="Clientes nuevos"
              value={String(clientes_nuevos_mes)}
              sub={`${total_resenas} resenas · promedio ${promedio_resenas.toFixed(1)}/5`}
            />
          </div>

          {/* Grafico de area: citas e ingresos por dia (30 dias) */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Citas e ingresos — ultimos 30 dias
              </h2>
              <button
                onClick={exportarCSVSerieMes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <IconDownload />
                CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={serie_diaria} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b6f47" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b6f47" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'ingresos' ? [formatCOP(value), 'Ingresos'] : [value, 'Citas']
                  }
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="citas" stroke="#8b6f47" fill="url(#colorCitas)" strokeWidth={2} name="citas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Fila: top servicios + distribucion de estados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Top servicios del mes
              </h2>
              {top_servicios.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Sin datos aun.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top_servicios} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
                      {top_servicios.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Estado de las citas del mes
              </h2>
              {distribucion_estados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Sin datos aun.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={distribucion_estados}
                      dataKey="total"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {distribucion_estados.map((d) => (
                        <Cell key={d.estado} fill={ESTADO_COLORS[d.estado] ?? '#999'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Periodo personalizado ─────────────────────────── */}
      {tabActiva === 'filtros' && (
        reporteFiltrado ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={<IconDownload />}
                label="Ingresos del periodo"
                value={formatCOP(reporteFiltrado.ingresos_periodo)}
              />
              <KpiCard
                icon={<IconFilter />}
                label="Citas del periodo"
                value={String(reporteFiltrado.total_citas)}
                sub={`${reporteFiltrado.citas_completadas} completadas · ${reporteFiltrado.citas_canceladas} canceladas · ${reporteFiltrado.citas_no_asistio} no-show`}
              />
              <KpiCard
                icon={<IconFilter />}
                label="Ticket promedio"
                value={formatCOP(reporteFiltrado.ticket_promedio)}
                sub={`${reporteFiltrado.tasa_completadas}% completadas`}
              />
              <KpiCard
                icon={<IconFilter />}
                label="Clientes nuevos"
                value={String(reporteFiltrado.clientes_nuevos)}
              />
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Citas por dia en el periodo
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={reporteFiltrado.serie_diaria} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="citas" stroke="#8b6f47" fill="#8b6f47" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Detalle de citas del periodo
                </h2>
                <button
                  onClick={exportarCSVCitas}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <IconDownload />
                  CSV
                </button>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-2">Fecha</th>
                      <th className="px-4 py-2">Hora</th>
                      <th className="px-4 py-2">Cliente</th>
                      <th className="px-4 py-2 hidden md:table-cell">Servicios</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reporteFiltrado.citas_detalle.map((c, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2">{c.fecha}</td>
                        <td className="px-4 py-2">{c.hora}</td>
                        <td className="px-4 py-2 font-medium">{c.cliente}</td>
                        <td className="px-4 py-2 hidden md:table-cell text-muted-foreground">{c.servicios}</td>
                        <td className="px-4 py-2">{c.estado}</td>
                        <td className="px-4 py-2 text-right">{formatCOP(c.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Elige un rango de fechas y presiona &quot;Aplicar filtros&quot;.
          </p>
        )
      )}

      {/* ── Tab: Por servicio ──────────────────────────────────── */}
      {tabActiva === 'servicios' && (
        <div className="bg-card rounded-xl border border-border">
          {servicios === null ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Elige un rango de fechas en &quot;Periodo personalizado&quot; para ver el rendimiento por servicio.
            </p>
          ) : (
            <TablaServicios servicios={servicios} />
          )}
        </div>
      )}
    </div>
  )
}