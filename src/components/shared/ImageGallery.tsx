'use client'

// ============================================================
// ImageGallery.tsx — Fase 6
// Galería de imágenes reutilizable con lightbox básico.
// ============================================================

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: { src: string; alt?: string }[]
  columns?: 2 | 3 | 4
}

export function ImageGallery({ images, columns = 3 }: ImageGalleryProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  }[columns]

  return (
    <>
      <div className={`grid gap-2 ${colClass}`}>
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
          >
            <Image
              src={img.src}
              alt={img.alt ?? `Imagen ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={images[selected].src}
              alt={images[selected].alt ?? `Imagen ${selected + 1}`}
              width={1200}
              height={900}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>
          <button
            className="absolute right-4 top-4 text-white"
            onClick={() => setSelected(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
