// ============================================================
// src/app/admin/page.tsx — Fase 17 (rehecho: sin ingresos/pagos)
// Dashboard administrativo con metricas operativas en tiempo real.
// Server Component: datos frescos en cada carga.
// ============================================================

import { Suspense } from 'react'
import Link from 'next/link'
import { getDashboardStats } from '@/services/dashboard'
import { StatCard } from '@/components/admin/StatCard'
import { CitasHoyWidget } from '@/components/admin/CitasHoyWidget'

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatHora(h: string) {
  return h.slice(0, 5)
}

// ── Iconos SVG inline ─────────────────────────────────────────
const IconCalendar = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconUsers = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCheck = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconX = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const IconClock = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

// ── Dashboard ─────────────────────────────────────────────────
export default async function AdminPage() {
  const stats = await getDashboardStats()

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen operativo del negocio en tiempo real.
          </p>
        </div>
        <Link
          href="/admin/reportes"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver analíticas completas →
        </Link>
      </div>

      {/* ── Metricas de actividad ─────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Actividad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            titulo="Citas hoy"
            valor={String(stats.citas_hoy_count)}
            subtitulo="sin canceladas"
            icon={IconCalendar}
          />
          <StatCard
            titulo="Tasa de asistencia"
            valor={`${stats.tasa_asistencia_mes}%`}
            subtitulo="este mes"
            icon={IconCheck}
            colorClase={stats.tasa_asistencia_mes >= 80 ? 'text-green-600' : 'text-amber-600'}
          />
          <StatCard
            titulo="Clientes nuevos"
            valor={String(stats.clientes_nuevos_mes)}
            subtitulo="este mes"
            icon={IconUsers}
            colorClase="text-blue-600"
          />
          <StatCard
            titulo="Cancel. / no-show"
            valor={`${stats.cancelaciones_semana} / ${stats.no_asistio_semana}`}
            subtitulo="últimos 7 días"
            icon={IconX}
            colorClase="text-destructive"
          />
        </div>
      </section>

      {/* ── Fila inferior: proxima cita + top servicios ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Proxima cita */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-primary">{IconClock}</span>
            Proxima cita
          </h2>
          {stats.proxima_cita ? (
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">
                {formatHora(stats.proxima_cita.hora_inicio)}
              </p>
              <p className="text-sm font-medium text-foreground">
                {stats.proxima_cita.cliente_nombre}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.proxima_cita.servicios_nombres.join(', ') || 'Sin servicios'}
              </p>
              <p className="text-sm text-accent font-medium">
                {formatCOP(stats.proxima_cita.precio_total)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay mas citas hoy.</p>
          )}
        </div>

        {/* Top servicios */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Top servicios del mes
          </h2>
          {stats.top_servicios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aun.</p>
          ) : (
            <ol className="space-y-3">
              {stats.top_servicios.map((s, i) => (
                <li key={s.nombre} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{s.nombre}</p>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.round((s.cantidad / (stats.top_servicios[0]?.cantidad || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.cantidad} {s.cantidad === 1 ? 'vez' : 'veces'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Volumen de citas */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Volumen de citas
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Últimos 7 días</span>
            <span className="text-lg font-semibold text-foreground">{stats.citas_semana_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mes actual</span>
            <span className="text-lg font-semibold text-foreground">{stats.citas_mes_count}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Ve tendencias y gráficas completas en{' '}
            <Link href="/admin/reportes" className="text-primary hover:underline">Estadísticas</Link>.
          </p>
        </div>
      </div>

      {/* ── Citas del dia ─────────────────────────────────────── */}
      <section className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Citas de hoy — {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground py-4 text-center">Cargando citas...</p>}>
          <CitasHoyWidget citas={stats.citas_hoy} />
        </Suspense>
      </section>
    </div>
  )
}
