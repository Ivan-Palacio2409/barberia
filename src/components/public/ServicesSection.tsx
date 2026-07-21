import Link from 'next/link'
import type { CategoriaServicio, Servicio } from '@/types'
import { ROUTES } from '@/constants'
import { ServiceCard } from '@/components/servicios/ServiceCard'

interface Props {
  categorias: (CategoriaServicio & { servicios: Servicio[] })[]
}

function CategoryIcon({ nombre }: { nombre: string }) {
  if (nombre.toLowerCase().includes('corte')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="6" cy="18" r="2.2" />
        <circle cx="6" cy="6" r="2.2" />
        <path d="M7.8 7.4 L20 18 M7.8 16.6 L20 6" strokeLinecap="round" />
      </svg>
    )
  }
  if (nombre.toLowerCase().includes('barb')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 4 L20 4 L20 10 C20 15 16 20 12 20 C8 20 4 15 4 10 Z" />
        <path d="M9 10 C9.5 12 10.5 13 12 13 C13.5 13 14.5 12 15 10" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 2 C12 2 6 9 6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14 C18 9 12 2 12 2z" />
    </svg>
  )
}

export function ServicesSection({ categorias }: Props) {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="servicios-titulo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--pub-gold)' }}>
            Lo que ofrecemos
          </p>
          <h2 id="servicios-titulo" className="font-display text-4xl lg:text-5xl font-semibold" style={{ color: 'var(--pub-text)' }}>
            Nuestros servicios
          </h2>
          <p className="text-base leading-relaxed max-w-lg" style={{ color: 'var(--pub-text-muted)' }}>
            Desde el corte clásico hasta los tratamientos más completos. Elige el servicio que mejor se adapte a ti.
          </p>
        </div>

        <div className="space-y-14">
          {categorias.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2.5 mb-5">
                <span style={{ color: 'var(--pub-gold)' }}>
                  <CategoryIcon nombre={cat.nombre} />
                </span>
                <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--pub-text)' }}>
                  {cat.nombre}
                </h3>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:gap-3">
                {cat.servicios.map((s, i) => (
                  <ServiceCard key={s.id} servicio={s} popular={i === 0} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link
            href={ROUTES.servicios}
            className="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-lg border text-sm font-medium transition-colors hover:bg-white/[0.04] lg:inline-flex lg:w-auto lg:justify-start lg:py-2.5"
            style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
          >
            Ver todos los servicios
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}