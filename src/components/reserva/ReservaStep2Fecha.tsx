'use client'

import { useState } from 'react'
import { useReserva } from '@/hooks/useReserva'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function isoToLocal(iso: string) {
  return new Date(iso + 'T12:00:00')
}

interface Props {
  fechasDisponibles: string[]
  onNext: () => void
  onBack: () => void
}

export function ReservaStep2Fecha({ fechasDisponibles, onNext, onBack }: Props) {
  const { fechaSeleccionada, setFecha, duracionTotal } = useReserva()

  const disponiblesSet = new Set(fechasDisponibles)

  // Mes en pantalla
  const hoy = new Date()
  const [viewYear, setViewYear] = useState(hoy.getFullYear())
  const [viewMonth, setViewMonth] = useState(hoy.getMonth())

  /** Navegar al mes anterior */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  /** Navegar al mes siguiente */
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Celdas del mes
  const primerDia = new Date(viewYear, viewMonth, 1).getDay()
  const diasEnMes = new Date(viewYear, viewMonth + 1, 0).getDate()

  const celdas: (number | null)[] = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  // Rellenar última fila a múltiplo de 7
  while (celdas.length % 7 !== 0) celdas.push(null)

  function isoDelDia(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // No retroceder antes del mes actual
  const esHoyOAntes =
    viewYear < hoy.getFullYear() ||
    (viewYear === hoy.getFullYear() && viewMonth <= hoy.getMonth())

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold mb-1"
          style={{ color: 'var(--pub-text)' }}
        >
          Selecciona la Fecha
        </h2>
        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
          Solo se muestran fechas con disponibilidad para tus servicios ({duracionTotal()} min).
        </p>
      </div>

      {/* Calendario */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(245, 245, 245,0.2)' }}
      >
        {/* Header mes */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(245, 245, 245,0.06)' }}
        >
          <button
            type="button"
            onClick={prevMonth}
            disabled={esHoyOAntes}
            aria-label="Mes anterior"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ color: 'var(--pub-text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h3 className="font-semibold text-base" style={{ color: 'var(--pub-text)' }}>
            {MESES[viewMonth]} {viewYear}
          </h3>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Mes siguiente"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--pub-text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Encabezados días */}
        <div className="grid grid-cols-7 px-2 pt-3 pb-1">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold uppercase tracking-wider py-1"
              style={{ color: 'var(--pub-text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1 p-2 pb-4">
          {celdas.map((day, i) => {
            if (!day) return <div key={i} />

            const iso = isoDelDia(day)
            const disponible = disponiblesSet.has(iso)
            const seleccionado = fechaSeleccionada === iso
            const esHoy =
              hoy.getFullYear() === viewYear &&
              hoy.getMonth() === viewMonth &&
              hoy.getDate() === day

            return (
              <button
                key={i}
                type="button"
                aria-label={`${day} de ${MESES[viewMonth]}`}
                aria-pressed={seleccionado}
                disabled={!disponible}
                onClick={() => {
                  setFecha(iso)
                }}
                className="aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed"
                style={
                  seleccionado
                    ? {
                        background:
                          'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                        color: 'var(--pub-on-gold)',
                        boxShadow: '0 3px 10px rgba(245, 245, 245,0.4)',
                      }
                    : disponible
                    ? esHoy
                      ? {
                          border: '2px solid var(--pub-gold)',
                          color: 'var(--pub-gold)',
                          fontWeight: 700,
                        }
                      : { color: 'var(--pub-text)' }
                    : { color: 'rgba(226,226,226,0.15)' }
                }
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--pub-text-muted)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, var(--pub-gold), var(--pub-gold-strong))' }} />
          Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: 'var(--pub-gold)' }} />
          Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(226,226,226,0.12)' }} />
          Sin disponibilidad
        </span>
      </div>

      {/* Fecha seleccionada */}
      {fechaSeleccionada && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(245, 245, 245,0.08)', color: 'var(--pub-gold)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {isoToLocal(fechaSeleccionada).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      )}

      {/* Navegacion */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-colors"
          style={{ borderColor: 'rgba(245, 245, 245,0.3)', color: 'var(--pub-text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!fechaSeleccionada}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
          }}
        >
          Elegir horario
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}