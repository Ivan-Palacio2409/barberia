'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFavoritosByCliente, removeFavorito } from '@/services/favoritos'
import { FavoritoButton } from './FavoritoButton'
import type { EstiloFavorito } from '@/types'

// ── Iconos SVG ───────────────────────────────────────────────
function HeartIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

interface Props {
  clienteId: string
}

export function MisFavoritos({ clienteId }: Props) {
  const [favoritos, setFavoritos] = useState<EstiloFavorito[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFavoritosByCliente(clienteId).then((data) => {
      setFavoritos(data)
      setLoading(false)
    })
  }, [clienteId])

  const handleRemove = async (catalogoEstiloId: string) => {
    const ok = await removeFavorito(clienteId, catalogoEstiloId)
    if (ok) {
      setFavoritos((prev) => prev.filter((f) => f.catalogo_estilo_id !== catalogoEstiloId))
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (favoritos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-stone-400">
        <HeartIcon />
        <p className="text-sm">Aun no tienes estilos guardados.</p>
        <Link
          href="/galeria"
          className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
        >
          Explorar galeria
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {favoritos.map((fav) => {
        const estilo = fav.catalogo_estilo
        if (!estilo) return null

        return (
          <div key={fav.id} className="group relative rounded-xl overflow-hidden bg-stone-100 aspect-square">
            {/* Imagen */}
            <img
              src={estilo.imagen_url}
              alt={estilo.titulo}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Overlay al hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex flex-col justify-between p-3">
              {/* Boton quitar favorito */}
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <FavoritoButton
                  clienteId={clienteId}
                  catalogoEstiloId={estilo.id}
                  initialFavorite
                  onToggle={(isFav) => { if (!isFav) handleRemove(estilo.id) }}
                />
              </div>

              {/* Info + CTA */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                <p className="text-white text-xs font-medium line-clamp-1">{estilo.titulo}</p>
                <Link
                  href={`/reservar?estilo=${estilo.id}`}
                  className="flex items-center gap-1.5 text-xs bg-white text-rose-700 font-semibold px-3 py-1.5 rounded-full w-fit hover:bg-rose-50 transition-colors"
                >
                  <CalendarIcon />
                  Reservar este estilo
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
