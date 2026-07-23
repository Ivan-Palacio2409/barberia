'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { reagendarCita, getHorariosDisponibles } from '@/lib/citas'
import type { CitaConServicios } from '@/types'

// ── Iconos SVG ───────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ── Props ────────────────────────────────────────────────────
interface ModalReagendarProps {
  cita: CitaConServicios
  clienteId: string
  onClose: () => void
  onSuccess: () => void
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function buildCalendar(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array(firstDay).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// ── Componente ───────────────────────────────────────────────
export function ModalReagendar({ cita, clienteId, onClose, onSuccess }: ModalReagendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<string[]>([])
  const [selectedHora, setSelectedHora] = useState<string | null>(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Duración total de los servicios de la cita
  const duracion = cita.cita_servicios?.reduce(
    (acc, cs) => acc + (cs.servicio?.duracion_minutos ?? 0), 0
  ) ?? 60

  const fetchHorarios = useCallback(
    async (fecha: string) => {
      setLoadingHorarios(true)
      setHorarios([])
      setSelectedHora(null)
      try {
        const h = await getHorariosDisponibles(fecha, duracion)
        setHorarios(h)
      } catch {
        setHorarios([])
      } finally {
        setLoadingHorarios(false)
      }
    },
    [duracion]
  )

  useEffect(() => {
    if (selectedDate) fetchHorarios(selectedDate)
  }, [selectedDate, fetchHorarios])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const handleConfirmar = async () => {
    if (!selectedDate || !selectedHora) return
    setSubmitting(true)
    setError(null)
    try {
      // Calcular hora_fin a partir de hora_inicio + duración
      const [h, m] = selectedHora.split(':').map(Number)
      const totalMin = h * 60 + m + duracion
      const horaFin = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
      await reagendarCita(cita.id, clienteId, selectedDate, selectedHora, horaFin)
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const weeks = buildCalendar(viewYear, viewMonth)
  const todayISO = toISO(today)

  return (
    /* Overlay */
    <div
      className="modal-light-card fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'rgba(41, 36, 33,0.2)' }}>
          <h2 className="font-display text-lg font-semibold">Reagendar cita</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Calendario */}
          <div>
            {/* Navegación mes */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                aria-label="Mes anterior"
              >
                <ChevronLeftIcon />
              </button>
              <span className="font-medium text-sm">
                {MESES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                aria-label="Mes siguiente"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* Encabezados días */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((date, di) => {
                  if (!date) return <div key={di} />
                  const iso = toISO(date)
                  const isPast = iso < todayISO
                  const isSelected = iso === selectedDate

                  return (
                    <button
                      key={di}
                      disabled={isPast}
                      onClick={() => setSelectedDate(iso)}
                      className={cn(
                        'h-9 w-full rounded-lg text-sm transition-colors',
                        isPast && 'text-muted-foreground/40 cursor-not-allowed',
                        !isPast && !isSelected && 'hover:bg-primary/10',
                        isSelected && 'font-semibold text-white'
                      )}
                      style={isSelected ? { background: '#292421' } : undefined}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Horarios */}
          {selectedDate && (
            <div>
              <p className="text-sm font-medium mb-2">Horario disponible</p>
              {loadingHorarios ? (
                <p className="text-sm text-muted-foreground">Cargando horarios...</p>
              ) : horarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay horarios disponibles para esta fecha.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {horarios.map((h) => (
                    <button
                      key={h}
                      onClick={() => setSelectedHora(h)}
                      className={cn(
                        'rounded-lg border py-2 text-sm font-medium transition-colors',
                        selectedHora === h
                          ? 'border-transparent text-white'
                          : 'border-border hover:border-primary/40 hover:bg-primary/5'
                      )}
                      style={selectedHora === h ? { background: '#292421', borderColor: '#292421' } : undefined}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: 'rgba(41, 36, 33,0.2)' }}>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!selectedDate || !selectedHora || submitting}
            onClick={handleConfirmar}
          >
            {submitting ? 'Guardando...' : 'Confirmar cambio'}
          </Button>
        </div>
      </div>
    </div>
  )
}