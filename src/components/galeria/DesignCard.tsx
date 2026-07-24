'use client'

import Image from 'next/image'
import type { EstiloConCategoria } from '@/services/galeria'

interface Props {
  estilo: EstiloConCategoria
  onOpen: (estilo: EstiloConCategoria) => void
}

export function DesignCard({ estilo: d, onOpen }: Props) {
  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl bg-[var(--pub-gold)]/10 transition-shadow duration-300"
      style={{
        aspectRatio: '3 / 4',
        // Destacado: anillo dorado bien visible alrededor de toda la
        // tarjeta, no solo un icono pequeño, para que se note de un
        // vistazo aunque no se pase el mouse por encima.
        boxShadow: d.destacado
          ? '0 0 0 2.5px var(--pub-gold-strong), 0 8px 24px rgba(233,193,118,0.25)'
          : 'none',
      }}
    >
      {/* Imagen clickeable — es todo el contenido de la tarjeta */}
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

      {/* Overlay en hover: solo el título, nada más */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(44,34,24,0.82) 0%, transparent 55%)',
        }}
      >
        <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{d.titulo}</p>
      </div>

      {/* Badge destacado — siempre visible (no solo en hover), con
          etiqueta clara en vez de un simple icono que se confundia
          con el resto de la tarjeta. */}
      {d.destacado && (
        <div
          className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm"
          style={{ background: 'var(--pub-gold-strong)', color: 'var(--pub-on-gold)' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Destacado
        </div>
      )}
    </div>
  )
}