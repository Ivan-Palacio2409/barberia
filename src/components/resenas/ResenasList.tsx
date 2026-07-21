'use client'

import { useState } from 'react'
import type { Resena } from '@/types'
import { ResenaCard } from './ResenaCard'

interface ResenasListProps {
  resenasIniciales: Resena[]
}

const POR_PAGINA = 6

export function ResenasList({ resenasIniciales }: ResenasListProps) {
  const [resenas, setResenas] = useState<Resena[]>(resenasIniciales)
  const [pagina, setPagina] = useState(1)

  // Exponer setter para que el formulario pueda agregar la reseña nueva al inicio
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__agregarResena = (r: Resena) => setResenas((prev) => [r, ...prev])
  }

  const visible = resenas.slice(0, pagina * POR_PAGINA)
  const hayMas = visible.length < resenas.length

  if (resenas.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--pub-text-muted)]">
        <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <p className="text-sm">Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((resena) => (
          <ResenaCard key={resena.id} resena={resena} />
        ))}
      </div>

      {hayMas && (
        <div className="text-center">
          <button
            onClick={() => setPagina((p) => p + 1)}
            className="px-6 py-2.5 rounded-lg border border-[var(--pub-gold)]/40 text-sm font-medium text-[var(--pub-text)] hover:bg-[var(--pub-bg)] transition"
          >
            Ver mas reseñas
          </button>
        </div>
      )}
    </div>
  )
}
