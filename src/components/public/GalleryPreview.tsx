import Link from 'next/link'
import Image from 'next/image'
import type { CatalogoEstilo } from '@/types'
import { ROUTES } from '@/constants'

interface Props {
  estilos: CatalogoEstilo[]
}

export function GalleryPreview({ estilos }: Props) {
  if (estilos.length === 0) return null

  return (
    <section className="py-20 lg:py-28" style={{ background: 'var(--pub-bg-soft)' }} aria-labelledby="galeria-titulo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--pub-gold)' }}>
              Inspiración
            </p>
            <h2 id="galeria-titulo" className="font-display text-4xl lg:text-5xl font-semibold" style={{ color: 'var(--pub-text)' }}>
              Diseños destacados
            </h2>
          </div>
          <Link
            href={ROUTES.galeria}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--pub-gold)' }}
          >
            Ver galería completa
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {estilos.slice(0, 8).map((d, i) => (
            <Link
              key={d.id}
              href={ROUTES.galeria}
              className={`relative group overflow-hidden rounded-xl pub-card ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              style={{ aspectRatio: i === 0 ? '1 / 1' : '3 / 4' }}
              aria-label={`Ver diseño: ${d.titulo}`}
            >
              <Image
                src={d.imagen_url}
                alt={d.titulo}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes={i === 0 ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
              />

              <div
                className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(to top, rgba(11,10,9,0.9) 0%, transparent 60%)' }}
              >
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{d.titulo}</p>
                  {d.precio_referencia && (
                    <p className="text-white/65 text-xs mt-0.5">
                      Desde{' '}
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                      }).format(d.precio_referencia)}
                    </p>
                  )}
                </div>
              </div>

              {d.categoria && (
                <div
                  className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-sm"
                  style={{ background: 'rgba(11,10,9,0.8)', color: 'var(--pub-gold-strong)', border: '1px solid var(--pub-border)' }}
                >
                  {d.categoria.nombre}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
