'use client'

import { useState } from 'react'
import { reprogramarCita } from '@/services/citas'
import type { Cita } from '@/types'

// ============================================================
// ModalReagendar.tsx — Fase 19
// Modal para reagendar una cita: selección de nueva fecha,
// hora de inicio y hora de fin con validación Zod-lite.
// ============================================================

interface Props {
  cita: Cita
  onClose: () => void
  onGuardado: () => void
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + hours * 60
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

export function ModalReagendar({ cita, onClose, onGuardado }: Props) {
  const [fecha, setFecha] = useState(cita.fecha)
  const [inicio, setInicio] = useState(cita.hora_inicio.slice(0, 5))
  const [fin, setFin] = useState(cita.hora_fin.slice(0, 5))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Duración original de la cita, para preservarla si cambia la hora de inicio.
  const duracionOriginalHoras = (() => {
    const [h1, m1] = cita.hora_inicio.slice(0, 5).split(':').map(Number)
    const [h2, m2] = cita.hora_fin.slice(0, 5).split(':').map(Number)
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60
  })()

  function handleInicioChange(nuevaInicio: string) {
    setInicio(nuevaInicio)
    setFin(addHours(nuevaInicio, duracionOriginalHoras))
    setError('')
  }

  function validar(): string {
    if (!fecha) return 'Selecciona una fecha.'
    if (new Date(fecha) < new Date(new Date().toDateString())) return 'La fecha debe ser hoy o en el futuro.'
    if (inicio >= fin) return 'La hora de inicio debe ser anterior a la hora de fin.'
    return ''
  }

  async function handleGuardar() {
    const err = validar()
    if (err) { setError(err); return }
    setError('')
    setGuardando(true)
    try {
      await reprogramarCita(cita.id, fecha, inicio + ':00', fin + ':00')
      onGuardado()
    } catch {
      setError('No se pudo reagendar la cita. Verifica que el horario esté disponible.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold">Reagendar cita</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nueva fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); setError('') }}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Hora inicio</label>
              <input
                type="time"
                value={inicio}
                onChange={(e) => handleInicioChange(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Hora fin</label>
              <input
                type="time"
                value={fin}
                onChange={(e) => { setFin(e.target.value); setError('') }}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Reagendar'}
          </button>
        </div>
      </div>
    </div>
  )
}
