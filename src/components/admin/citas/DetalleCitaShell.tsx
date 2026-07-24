'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Cita, EstadoCita } from '@/types'
import { actualizarEstadoCita, cancelarCitaAdmin } from '@/services/citas'
import { ModalReagendar } from './ModalReagendar'
import { GaleriaReferencia } from './GaleriaReferencia'
import { AsistenciaCard } from './AsistenciaCard'

// ============================================================
// DetalleCitaShell.tsx — Fase 19
// Detalle completo de una cita: cliente, servicios, estado,
// imágenes de referencia, historial del cliente y acciones.
// ============================================================

interface Props {
  cita: Cita
  historial: Cita[]
}

type TabDetalle = 'cita' | 'historial'

const ESTADO_STYLES: Record<EstadoCita, string> = {
  pendiente:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmada: 'bg-blue-50 text-blue-700 border border-blue-200',
  completada: 'bg-green-50 text-green-700 border border-green-200',
  cancelada:  'bg-red-50 text-red-700 border border-red-200',
  no_asistio: 'bg-stone-100 text-stone-700 border border-stone-300',
}

const ESTADO_LABEL: Record<EstadoCita, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
  no_asistio: 'No asistió',
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatHora(hora: string) {
  return hora.slice(0, 5)
}

function duracionTexto(inicio: string, fin: string): string {
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  const mins = (hf * 60 + mf) - (hi * 60 + mi)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function DetalleCitaShell({ cita, historial }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabDetalle>('cita')
  const [modalReagendar, setModalReagendar] = useState(false)
  const [, startTransition] = useTransition()

  const servicios =
    (cita as unknown as { cita_servicios?: { servicio: { nombre: string; duracion_minutos: number; precio: number } }[] })
      .cita_servicios ?? []

  function handleEstado(estado: EstadoCita) {
    startTransition(async () => {
      await actualizarEstadoCita(cita.id, estado)
      router.refresh()
    })
  }

  function handleCancelar() {
    startTransition(async () => {
      await cancelarCitaAdmin(cita.id, cita.cliente_id)
      router.refresh()
    })
  }

  const puedeCompletar = cita.estado === 'confirmada'
  const puedeCancelar = cita.estado !== 'cancelada' && cita.estado !== 'completada'
  const puedeReagendar = cita.estado !== 'cancelada' && cita.estado !== 'completada'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/calendario" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-semibold text-foreground capitalize">
                {formatFecha(cita.fecha)}
              </h1>
              <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium border', ESTADO_STYLES[cita.estado])}>
                {ESTADO_LABEL[cita.estado]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatHora(cita.hora_inicio)} – {formatHora(cita.hora_fin)} · {duracionTexto(cita.hora_inicio, cita.hora_fin)}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {puedeCompletar && (
            <button
              onClick={() => handleEstado('completada')}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Completar
            </button>
          )}
          {puedeReagendar && (
            <button
              onClick={() => setModalReagendar(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Reagendar
            </button>
          )}
          {puedeCancelar && (
            <button
              onClick={() => {
                if (confirm('¿Cancelar esta cita?')) handleCancelar()
              }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancelar cita
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {([
            { key: 'cita', label: 'Detalle de la cita' },
            { key: 'historial', label: `Historial del cliente (${historial.length})` },
          ] as { key: TabDetalle; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'cita' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Cliente</h2>
              {cita.cliente ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{cita.cliente.nombre}</p>
                    <p className="text-sm text-muted-foreground">{cita.cliente.telefono}</p>
                    {cita.cliente.email && (
                      <p className="text-sm text-muted-foreground">{cita.cliente.email}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/clientes/${cita.cliente_id}`}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Ver ficha
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cliente no disponible.</p>
              )}
            </div>

            {/* Servicios */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Servicios</h2>
              {servicios.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin servicios registrados.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {servicios.map((cs, i) => (
                    <li key={i} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-foreground">{cs.servicio.nombre}</p>
                        <p className="text-xs text-muted-foreground">{cs.servicio.duracion_minutos} min</p>
                      </div>
                      <span className="text-muted-foreground">
                        ${Number(cs.servicio.precio).toLocaleString('es-CO')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notas */}
            {cita.notas && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notas</h2>
                <p className="text-sm text-foreground whitespace-pre-wrap">{cita.notas}</p>
              </div>
            )}

            {/* Imagenes de referencia */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Imagenes de referencia ({(cita.estilos_referencia ?? []).length})
              </h2>
              <GaleriaReferencia estilos={cita.estilos_referencia ?? []} />
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Total del servicio (sin seguimiento de pagos: se paga en el local) */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total de la cita</h2>
              <p className="text-2xl font-display font-semibold text-foreground">
                ${Number(cita.precio_total ?? 0).toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-muted-foreground">Se paga en el local el día de la cita.</p>
            </div>

            {/* Asistencia y reseña */}
            <AsistenciaCard cita={cita} onUpdated={() => router.refresh()} />
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3">
          {historial.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Sin historial de citas previas.
            </div>
          ) : (
            historial.map((c) => {
              const svcs =
                (c as unknown as { cita_servicios?: { servicio: { nombre: string } }[] })
                  .cita_servicios?.map((cs) => cs.servicio.nombre) ?? []
              return (
                <div
                  key={c.id}
                  className={cn(
                    'bg-card rounded-xl border p-4 flex items-start justify-between gap-4',
                    c.id === cita.id ? 'border-primary/40 bg-primary/5' : 'border-border'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', ESTADO_STYLES[c.estado])}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                      {c.id === cita.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Esta cita
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatHora(c.hora_inicio)} – {formatHora(c.hora_fin)}
                    </p>
                    {svcs.length > 0 && (
                      <p className="text-xs text-muted-foreground">{svcs.join(', ')}</p>
                    )}
                  </div>
                  {c.id !== cita.id && (
                    <Link
                      href={`/admin/citas/${c.id}`}
                      className="shrink-0 text-xs text-primary hover:underline font-medium"
                    >
                      Ver
                    </Link>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modales */}
      {modalReagendar && (
        <ModalReagendar
          cita={cita}
          onClose={() => setModalReagendar(false)}
          onGuardado={() => {
            setModalReagendar(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}