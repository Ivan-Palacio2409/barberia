'use client'

import { useState } from 'react'
import type { ListaEspera } from '@/types'
import { EstadoBadge } from './EstadoBadge'
import { cancelarInscripcion } from '@/services/lista-espera'

interface InscripcionCardProps {
  inscripcion: ListaEspera
  onCancelada: (id: string) => void
}

function formatFecha(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function InscripcionCard({ inscripcion, onCancelada }: InscripcionCardProps) {
  const [cancelando, setCancelando] = useState(false)

  async function handleCancelar() {
    if (!confirm('¿Seguro que deseas cancelar esta solicitud?')) return
    setCancelando(true)
    const ok = await cancelarInscripcion(inscripcion.id)
    if (ok) onCancelada(inscripcion.id)
    else setCancelando(false)
  }

  const activa = inscripcion.estado === 'en_espera' || inscripcion.estado === 'notificado'

  return (
    <article className="bg-[var(--pub-surface)] rounded-xl border border-[var(--pub-gold)]/20 p-5 flex flex-col gap-3">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-sm text-[var(--pub-text)]">
            {formatFecha(inscripcion.fecha_solicitada)}
          </p>
          <time
            dateTime={inscripcion.created_at}
            className="text-xs text-[var(--pub-text-muted)]"
          >
            Solicitado el{' '}
            {new Date(inscripcion.created_at).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        </div>
        <EstadoBadge estado={inscripcion.estado} />
      </div>

      {/* Servicios */}
      {inscripcion.servicios_deseados && (
        <div className="flex items-start gap-2 text-sm text-[var(--pub-text-muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          <span>{inscripcion.servicios_deseados}</span>
        </div>
      )}

      {/* Acción cancelar */}
      {activa && (
        <button
          onClick={handleCancelar}
          disabled={cancelando}
          className="self-start text-xs font-medium text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors disabled:opacity-50"
        >
          {cancelando ? 'Cancelando...' : 'Cancelar solicitud'}
        </button>
      )}
    </article>
  )
}
