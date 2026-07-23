'use client'

import { useState } from 'react'
import { crearResena } from '@/services/resenas'
import { cn } from '@/lib/utils'
import type { CitaConServicios } from '@/types'

// ============================================================
// ModalResena.tsx — Fase 26
// Modal para que el cliente deje una resena de una cita
// completada. Incluye selector de estrellas interactivo,
// textarea de comentario y manejo de error/exito.
// ============================================================

interface ModalResenaProps {
  cita: CitaConServicios
  clienteId: string
  onClose: () => void
  onSuccess: () => void
}

function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ── Selector de estrellas ─────────────────────────────────────
function SelectorEstrellas({
  valor,
  onChange,
  disabled,
}: {
  valor: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState(0)

  const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="Puntuacion">
        {[1, 2, 3, 4, 5].map((n) => {
          const activa = n <= (hover || valor)
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} estrellas`}
              className={cn(
                'transition-transform focus:outline-none',
                !disabled && 'hover:scale-110 cursor-pointer',
                disabled && 'cursor-default'
              )}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill={activa ? '#292421' : 'none'}
                stroke={activa ? '#292421' : '#d1d5db'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )
        })}
      </div>
      <p className="text-sm font-medium" style={{ color: '#292421', minHeight: '1.25rem' }}>
        {hover ? LABELS[hover] : valor ? LABELS[valor] : 'Selecciona una puntuacion'}
      </p>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function ModalResena({ cita, clienteId, onClose, onSuccess }: ModalResenaProps) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const servicios = (cita.cita_servicios ?? []).map(
    (cs: NonNullable<CitaConServicios['cita_servicios']>[number]) => cs.servicio ?? cs
  )
  const nombreServicio = servicios.map((s) => s.nombre).filter(Boolean).join(', ') || 'Servicio'

  const handleSubmit = async () => {
    if (puntuacion === 0) {
      setError('Selecciona una puntuacion antes de enviar.')
      return
    }
    setEnviando(true)
    setError(null)

    try {
      await crearResena({
        cliente_id: clienteId,
        puntuacion,
        comentario: comentario.trim() || undefined,
        cita_id: cita.id,
      })
      onSuccess()
    } catch (e) {
      const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code?: string }).code : undefined
      if (code === '23505') {
        setError('Ya dejaste una resena para esta cita.')
      } else {
        setError('No se pudo enviar la resena. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="modal-light-card fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Dejar resena
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatearFecha(cita.fecha)} — {nombreServicio}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/30 transition-colors"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 pb-6 space-y-5">
          {/* Estrellas */}
          <div className="flex justify-center py-2">
            <SelectorEstrellas
              valor={puntuacion}
              onChange={setPuntuacion}
              disabled={enviando}
            />
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="comentario-resena">
              Comentario <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              id="comentario-resena"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Comparte tu experiencia..."
              rows={4}
              maxLength={500}
              disabled={enviando}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60 placeholder:text-muted-foreground/60"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comentario.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={enviando}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={enviando || puntuacion === 0}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: puntuacion > 0 ? '#292421' : undefined, backgroundColor: puntuacion === 0 ? '#e5e7eb' : undefined }}
            >
              {enviando ? 'Enviando...' : 'Enviar resena'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}