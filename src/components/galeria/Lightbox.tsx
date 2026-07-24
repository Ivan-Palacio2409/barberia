'use client'

import { useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import type { EstiloConCategoria } from '@/services/galeria'

interface Props {
  estilo: EstiloConCategoria
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

export function Lightbox({ estilo: d, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  // Touch swipe
  const touchStartX = useRef<number | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
    },
    [onClose, onPrev, onNext, hasPrev, hasNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(20,14,8,0.92)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Diseño: ${d.titulo}`}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 60) {
          if (diff > 0 && hasNext && onNext) onNext()
          if (diff < 0 && hasPrev && onPrev) onPrev()
        }
        touchStartX.current = null
      }}
    >
      {/* Botón cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
        style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
        aria-label="Cerrar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Prev */}
      {hasPrev && onPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
          aria-label="Anterior"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next */}
      {hasNext && onNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
          aria-label="Siguiente"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Contenedor imagen */}
      <div
        className="relative mx-auto max-h-[85vh] max-w-lg w-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: '0 56px' }}
      >
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '3 / 4', maxHeight: '70vh' }}>
          <Image
            src={d.imagen_url}
            alt={d.titulo}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 90vw, 500px"
            priority
          />
        </div>

        {/* Info */}
        <div className="mt-4 px-1">
          <h2 className="text-white font-display text-xl font-semibold">{d.titulo}</h2>
        </div>
      </div>
    </div>
  )
}