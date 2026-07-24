'use client'

import { useState } from 'react'
import { DesignCard } from './DesignCard'
import { Lightbox } from './Lightbox'
import type { EstiloConCategoria } from '@/services/galeria'

interface Props {
  estilos: EstiloConCategoria[]
}

export function GalleryGrid({ estilos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (estilo: EstiloConCategoria) => {
    const idx = estilos.findIndex((d) => d.id === estilo.id)
    setLightboxIndex(idx)
  }

  const closeLightbox = () => setLightboxIndex(null)
  const goNext = () => setLightboxIndex((i) => (i !== null && i < estilos.length - 1 ? i + 1 : i))
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
      {/* Grid — solo imagenes, sin filtros de categoria */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {estilos.map((d) => (
          <DesignCard key={d.id} estilo={d} onOpen={openLightbox} />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && estilos[lightboxIndex] && (
        <Lightbox
          estilo={estilos[lightboxIndex]}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < estilos.length - 1}
        />
      )}
    </>
  )
}