'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cancelarCita } from '@/lib/citas'
import type { CitaConServicios } from '@/types'

// ── Icono SVG ────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ── Utilidades ───────────────────────────────────────────────
function formatearFechaHora(fecha: string, hora: string): string {
  const d = new Date(fecha + 'T00:00:00')
  const fechaStr = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const [h, m] = hora.split(':')
  const hNum = parseInt(h, 10)
  const ampm = hNum >= 12 ? 'pm' : 'am'
  const h12 = hNum % 12 || 12
  return `${fechaStr} a las ${h12}:${m} ${ampm}`
}

// ── Props ────────────────────────────────────────────────────
interface ModalCancelarProps {
  cita: CitaConServicios
  clienteId: string
  onClose: () => void
  onSuccess: () => void
}

// ── Componente ───────────────────────────────────────────────
export function ModalCancelar({ cita, clienteId, onClose, onSuccess }: ModalCancelarProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const servicios = cita.cita_servicios?.map((cs) => cs.servicio) ?? []
  const nombreServicios = servicios.map((s) => s.nombre).join(', ') || 'Sin servicios'

  const handleConfirmar = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await cancelarCita(cita.id, clienteId)
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-light-card fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'rgba(41, 36, 33,0.2)' }}>
          <h2 className="font-display text-lg font-semibold">Cancelar cita</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 text-center">
          {/* Icono de advertencia */}
          <div className="mb-4 flex justify-center text-destructive">
            <WarningIcon />
          </div>

          <p className="mb-1 font-medium text-foreground">
            Esta accion no se puede deshacer
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Vas a cancelar la cita del{' '}
            <span className="font-medium text-foreground capitalize">
              {formatearFechaHora(cita.fecha, cita.hora_inicio)}
            </span>
          </p>

          {/* Detalle de servicios */}
          <div
            className="rounded-xl border p-3 text-left mb-4"
            style={{ borderColor: 'rgba(41, 36, 33,0.2)', background: '#fdf5f5' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Servicios
            </p>
            <p className="text-sm">{nombreServicios}</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: 'rgba(41, 36, 33,0.2)' }}>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Volver
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={submitting}
            onClick={handleConfirmar}
          >
            {submitting ? 'Cancelando...' : 'Si, cancelar'}
          </Button>
        </div>
      </div>
    </div>
  )
}