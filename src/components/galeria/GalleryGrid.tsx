'use client'

import { useState, useMemo, useEffect } from 'react'
import { GalleryFilter } from './GalleryFilter'
import { DesignCard } from './DesignCard'
import { Lightbox } from './Lightbox'
import { useAuth } from '@/hooks/useAuth'
import { buscarPorAuthUserId } from '@/services/clientes'
import { getFavoritosIds } from '@/services/favoritos'
import type { EstiloConCategoria } from '@/services/galeria'
import type { CategoriaServicio } from '@/types'

interface Props {
  estilos: EstiloConCategoria[]
  categorias: Pick<CategoriaServicio, 'id' | 'nombre'>[]
}

export function GalleryGrid({ estilos, categorias }: Props) {
  const { user } = useAuth()
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Fase 14: cliente y favoritos del usuario autenticado
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setClienteId(null)
      setFavoritosIds(new Set())
      return
    }
    buscarPorAuthUserId(user.id).then((c) => {
      if (!c) return
      setClienteId(c.id)
      getFavoritosIds(c.id).then(setFavoritosIds)
    })
  }, [user])

  const filtered = useMemo(
    () =>
      activeCatId === null
        ? estilos
        : estilos.filter((d) => d.categoria?.id === activeCatId),
    [estilos, activeCatId],
  )

  const openLightbox = (estilo: EstiloConCategoria) => {
    const idx = filtered.findIndex((d) => d.id === estilo.id)
    setLightboxIndex(idx)
  }

  const closeLightbox = () => setLightboxIndex(null)
  const goNext = () => setLightboxIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i))
  const goPrev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))

  if (estilos.length === 0) {
    return (
      <p className="text-center py-20 text-sm" style={{ color: 'var(--pub-text-muted)' }}>
        La galeria estara disponible pronto.
      </p>
    )
  }

  return (
    <>
      {/* Filtros */}
      <div className="mb-8">
        <GalleryFilter
          categorias={categorias}
          activeId={activeCatId}
          onChange={setActiveCatId}
          total={estilos.length}
        />
      </div>

      {/* Contador */}
      <p className="text-xs mb-6" style={{ color: 'var(--pub-text-muted)' }}>
        Mostrando <strong style={{ color: 'var(--pub-text)' }}>{filtered.length}</strong>{' '}
        {filtered.length === 1 ? 'estilo' : 'estilos'}
        {activeCatId !== null && (
          <>
            {' '}en{' '}
            <strong style={{ color: 'var(--pub-gold)' }}>
              {categorias.find((c) => c.id === activeCatId)?.nombre}
            </strong>
          </>
        )}
        {clienteId && (
          <span className="ml-2 text-stone-400">
            &middot; Toca el corazon para guardar en favoritos
          </span>
        )}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
            No hay estilos en esta categoria aun.
          </p>
          <button
            type="button"
            onClick={() => setActiveCatId(null)}
            className="mt-4 text-sm font-medium underline"
            style={{ color: 'var(--pub-gold)' }}
          >
            Ver todos los estilos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {filtered.map((d) => (
            <DesignCard
              key={d.id}
              estilo={d}
              onOpen={openLightbox}
              clienteId={clienteId}
              favoritosIds={favoritosIds}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <Lightbox
          estilo={filtered[lightboxIndex]}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < filtered.length - 1}
        />
      )}
    </>
  )
}
