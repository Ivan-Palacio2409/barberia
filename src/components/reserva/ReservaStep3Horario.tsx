'use client'

import { useState, useEffect } from 'react'
import { useReserva } from '@/hooks/useReserva'
import { formatFechaLarga } from '@/lib/disponibilidad-utils'
import type { Slot } from '@/services/disponibilidad'

interface Props {
  onNext: () => void
  onBack: () => void
}

// ── Icono reloj ───────────────────────────────────────────────
function IconReloj({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Icono flecha izquierda ────────────────────────────────────
function IconArrowLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// ── Skeleton de carga ─────────────────────────────────────────
function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-11 rounded-xl animate-pulse"
          style={{ background: 'rgba(245, 245, 245,0.1)' }}
        />
      ))}
    </div>
  )
}

export function ReservaStep3Horario({ onNext, onBack }: Props) {
  const { fechaSeleccionada, horaInicio, duracionTotal, setHorario } = useReserva()

  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duracion = duracionTotal()

  // Cargar slots cuando cambia la fecha o la duración
  useEffect(() => {
    if (!fechaSeleccionada || duracion === 0) {
      setSlots([])
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api/slots?fecha=${fechaSeleccionada}&duracion=${duracion}`)
      .then((r) => {
        if (!r.ok) throw new Error('Error al obtener los horarios')
        return r.json() as Promise<Slot[]>
      })
      .then((data) => setSlots(data))
      .catch(() => setError('No pudimos cargar los horarios disponibles. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [fechaSeleccionada, duracion])

  function seleccionarSlot(slot: Slot) {
    setHorario(slot.horaInicio, slot.horaFin)
  }

  function handleContinuar() {
    if (!horaInicio) return
    onNext()
  }

  const fechaFormateada = fechaSeleccionada
    ? formatFechaLarga(fechaSeleccionada)
    : ''

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold mb-1"
          style={{ color: 'var(--pub-text)' }}
        >
          Horario Disponible
        </h2>
        {fechaFormateada && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--pub-text-muted)' }}>
            <IconReloj className="w-4 h-4" />
            {fechaFormateada} &middot; Duración estimada: {duracion} min
          </p>
        )}
      </div>

      {/* Contenido */}
      {loading && <SlotSkeleton />}

      {!loading && error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div
          className="rounded-xl p-8 text-center space-y-3"
          style={{ background: 'rgba(245, 245, 245,0.06)', border: '1px solid rgba(245, 245, 245,0.15)' }}
        >
          <IconReloj className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--pub-gold)' } as React.CSSProperties} />
          <p className="font-medium" style={{ color: 'var(--pub-text)' }}>
            Sin horarios disponibles
          </p>
          <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
            No hay cupos para esta fecha con la duración seleccionada. Elige otro día o
            únete a la lista de espera.
          </p>
          <a
            href="/lista-espera"
            className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold underline underline-offset-4"
            style={{ color: 'var(--pub-gold)' }}
          >
            Unirme a la lista de espera
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const activo = slot.horaInicio === horaInicio
            return (
              <button
                key={slot.horaInicio}
                type="button"
                onClick={() => seleccionarSlot(slot)}
                aria-pressed={activo}
                className="h-11 rounded-xl text-sm font-medium transition-all duration-200 border"
                style={
                  activo
                    ? {
                        background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                        color: 'var(--pub-on-gold)',
                        borderColor: 'transparent',
                        boxShadow: '0 2px 8px rgba(245, 245, 245,0.35)',
                      }
                    : {
                        background: 'rgba(245, 245, 245,0.06)',
                        color: 'var(--pub-text)',
                        borderColor: 'rgba(245, 245, 245,0.2)',
                      }
                }
              >
                {slot.horaInicio}
              </button>
            )
          })}
        </div>
      )}

      {/* Slot seleccionado — confirmación visual */}
      {horaInicio && !loading && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(245, 245, 245,0.08)',
            border: '1px solid rgba(245, 245, 245,0.2)',
            color: 'var(--pub-text)',
          }}
        >
          <IconReloj className="w-4 h-4 shrink-0" style={{ color: 'var(--pub-gold)' } as React.CSSProperties} />
          <span>
            Horario seleccionado:{' '}
            <strong style={{ color: 'var(--pub-gold)' }}>{horaInicio}</strong>
            {' '}— duración aproximada {duracion} min
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border transition-all duration-200"
          style={{
            borderColor: 'rgba(245, 245, 245,0.3)',
            color: 'var(--pub-text-muted)',
          }}
        >
          <IconArrowLeft />
          Atrás
        </button>

        <button
          type="button"
          onClick={handleContinuar}
          disabled={!horaInicio}
          className="flex-1 sm:flex-none sm:ml-auto px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={
            horaInicio
              ? {
                  background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                  color: 'var(--pub-on-gold)',
                  boxShadow: '0 2px 12px rgba(245, 245, 245,0.3)',
                }
              : {
                  background: 'rgba(245, 245, 245,0.12)',
                  color: 'var(--pub-text-muted)',
                }
          }
        >
          Continuar
        </button>
      </div>
    </div>
  )
}