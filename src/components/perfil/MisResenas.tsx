'use client'

import { useEffect, useState } from 'react'
import { getResenasCliente } from '@/services/resenas'
import type { Resena } from '@/types'

// ============================================================
// MisResenas.tsx — Fase 26
// Tab en el perfil del cliente que muestra las resenas enviadas,
// con puntuacion en estrellas y fecha.
// ============================================================

interface MisResenasProps {
  clienteId: string
}

function formatFecha(s: string) {
  return new Date(s).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function ScissorsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  )
}

function Estrellas({ puntuacion }: { puntuacion: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${puntuacion} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="16" height="16" viewBox="0 0 24 24"
          fill={n <= puntuacion ? 'hsl(var(--foreground))' : 'none'}
          stroke={n <= puntuacion ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export function MisResenas({ clienteId }: MisResenasProps) {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResenasCliente(clienteId)
      .then(setResenas)
      .finally(() => setLoading(false))
  }, [clienteId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl border bg-card p-5 animate-pulse" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex gap-2 mb-3">
              {[1,2,3,4,5].map(s => <div key={s} className="h-4 w-4 rounded bg-muted" />)}
            </div>
            <div className="h-3 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (resenas.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="hsl(var(--foreground))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div>
          <p className="font-display text-base font-semibold">Sin resenas aun</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tus resenas apareceran aqui despues de completar una cita.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {resenas.map(r => (
        <article
          key={r.id}
          className="rounded-2xl border bg-card p-5"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <Estrellas puntuacion={r.puntuacion} />
            <p className="text-xs text-muted-foreground shrink-0">{formatFecha(r.created_at)}</p>
          </div>
          {r.cita && r.cita.servicios_nombres.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: 'hsl(var(--accent))' }}>
              <ScissorsIcon />
              <span className="truncate">{r.cita.servicios_nombres.join(', ')}</span>
            </div>
          )}
          {r.comentario ? (
            <p className="text-sm text-foreground leading-relaxed">{r.comentario}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin comentario.</p>
          )}
        </article>
      ))}
    </div>
  )
}