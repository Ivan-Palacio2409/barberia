'use client'

import Image from 'next/image'
import { FavoritoButton } from '@/components/perfil/FavoritoButton'
import type { EstiloConCategoria } from '@/services/galeria'

function formatPrice(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio)
}

interface Props {
  estilo: EstiloConCategoria
  onOpen: (estilo: EstiloConCategoria) => void
  clienteId?: string | null        // Fase 14: si está autenticado muestra el corazon
  favoritosIds?: Set<string>       // Fase 14: set de IDs ya guardados
}

export function DesignCard({ estilo: d, onOpen, clienteId, favoritosIds }: Props) {
  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl bg-[var(--pub-gold)]/10"
      style={{ aspectRatio: '3 / 4' }}
    >
      {/* Imagen clickeable */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-zoom-in"
        onClick={() => onOpen(d)}
        aria-label={`Ampliar diseño: ${d.titulo}`}
      >
        <Image
          src={d.imagen_url}
          alt={d.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </button>

      {/* Overlay en hover */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(44,34,24,0.82) 0%, transparent 55%)',
        }}
      >
        <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{d.titulo}</p>
        {d.precio_referencia && (
          <p className="text-white/70 text-xs mt-0.5">Desde {formatPrice(d.precio_referencia)}</p>
        )}
        <div className="mt-2 flex items-center gap-1 text-white/60 text-xs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Ampliar
        </div>
      </div>

      {/* Badge categoria */}
      {d.categoria && (
        <div
          className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.88)', color: 'var(--pub-text)' }}
        >
          {d.categoria.nombre}
        </div>
      )}

      {/* Boton favorito (solo cuando el usuario esta autenticado) — Fase 14 */}
      {clienteId && (
        <div className="absolute top-3 right-3 z-10">
          <FavoritoButton
            clienteId={clienteId}
            catalogoEstiloId={d.id}
            initialFavorite={favoritosIds?.has(d.id) ?? false}
          />
        </div>
      )}

      {/* Badge destacado (cuando no hay boton favorito) */}
      {d.destacado && !clienteId && (
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: 'rgba(245, 245, 245,0.9)' }}
          aria-label="Diseño destacado"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" aria-hidden>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      )}
    </div>
  )
}
