'use client'

import { useState } from 'react'
import type { ListaEspera } from '@/types'
import { InscripcionCard } from './InscripcionCard'

interface MisInscripcionesProps {
  inscripciones: ListaEspera[]
}

export function MisInscripciones({ inscripciones: iniciales }: MisInscripcionesProps) {
  const [lista, setLista] = useState<ListaEspera[]>(iniciales)

  function handleCancelada(id: string) {
    setLista((prev) =>
      prev.map((i) => (i.id === id ? { ...i, estado: 'cancelado' as const } : i))
    )
  }

  const activas = lista.filter(
    (i) => i.estado === 'en_espera' || i.estado === 'notificado'
  )
  const historial = lista.filter(
    (i) => i.estado === 'cancelado' || i.estado === 'convertido'
  )

  if (lista.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--pub-text-muted)]">
        <svg className="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p className="text-sm">No tienes solicitudes registradas.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {activas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pub-text)] mb-3 uppercase tracking-wide">
            Activas ({activas.length})
          </h3>
          <div className="flex flex-col gap-3">
            {activas.map((i) => (
              <InscripcionCard key={i.id} inscripcion={i} onCancelada={handleCancelada} />
            ))}
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pub-text-muted)] mb-3 uppercase tracking-wide">
            Historial
          </h3>
          <div className="flex flex-col gap-3 opacity-60">
            {historial.map((i) => (
              <InscripcionCard key={i.id} inscripcion={i} onCancelada={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
