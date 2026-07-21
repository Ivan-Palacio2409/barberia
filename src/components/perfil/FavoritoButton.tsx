'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { addFavorito, removeFavorito } from '@/services/favoritos'

// ── Icono corazon SVG ────────────────────────────────────────
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

interface Props {
  clienteId: string
  catalogoEstiloId: string
  initialFavorite?: boolean
  onToggle?: (isFavorite: boolean) => void
  className?: string
}

export function FavoritoButton({ clienteId, catalogoEstiloId, initialFavorite = false, onToggle, className }: Props) {
  const [favorito, setFavorito] = useState(initialFavorite)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      if (favorito) {
        const ok = await removeFavorito(clienteId, catalogoEstiloId)
        if (ok) {
          setFavorito(false)
          onToggle?.(false)
        }
      } else {
        const result = await addFavorito(clienteId, catalogoEstiloId)
        if (result) {
          setFavorito(true)
          onToggle?.(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'p-2 rounded-full transition-all duration-200',
        favorito
          ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
          : 'text-stone-400 bg-white/80 hover:text-rose-400 hover:bg-rose-50',
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <HeartIcon filled={favorito} />
    </button>
  )
}
