'use client'

import { useState } from 'react'
import { ServiceCard } from './ServiceCard'
import type { CategoriaConServicios } from '@/services/servicios-ssr'
import { ROUTES } from '@/constants'
import Link from 'next/link'

interface Props {
  categorias: CategoriaConServicios[]
}

function CategoryIcon({ nombre }: { nombre: string }) {
  const n = nombre.toLowerCase()

  if (n.includes('corte')) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="6" cy="18" r="2.2" />
        <circle cx="6" cy="6" r="2.2" />
        <path d="M7.8 7.4 L20 18 M7.8 16.6 L20 6" strokeLinecap="round" />
      </svg>
    )
  }
  if (n.includes('barb')) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M4 4 L20 4 L20 10 C20 15 16 20 12 20 C8 20 4 15 4 10 Z" />
        <path d="M9 10 C9.5 12 10.5 13 12 13 C13.5 13 14.5 12 15 10" strokeLinecap="round" />
      </svg>
    )
  }
  // Tratamientos / default
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 2 C12 2 6 9 6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14 C18 9 12 2 12 2z" />
    </svg>
  )
}

export function ServiceTabs({ categorias }: Props) {
  const [activeId, setActiveId] = useState<string>(categorias[0]?.id ?? '')

  const activecat = categorias.find((c) => c.id === activeId) ?? categorias[0]

  if (!categorias.length) {
    return (
      <p className="text-center py-20" style={{ color: 'var(--pub-text-muted)' }}>
        No hay servicios disponibles por el momento.
      </p>
    )
  }

  const mostrarTabs = categorias.length > 1

  return (
    <div>
      {/* Tabs pill — solo se muestran si hay más de una categoría con servicios */}
      {mostrarTabs && (
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-hide"
        role="tablist"
        aria-label="Categorías de servicios"
      >
        {categorias.map((cat) => {
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${cat.id}`}
              id={`tab-${cat.id}`}
              onClick={() => setActiveId(cat.id)}
              className="flex items-center gap-2 shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                      color: 'var(--pub-on-gold)',
                      boxShadow: '0 4px 14px rgba(245, 245, 245,0.35)',
                    }
                  : {
                      background: 'rgba(245, 245, 245,0.08)',
                      color: 'var(--pub-text-muted)',
                    }
              }
            >
              <CategoryIcon nombre={cat.nombre} />
              {cat.nombre}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={
                  isActive
                    ? { background: 'rgba(255,255,255,0.25)', color: 'var(--pub-on-gold)' }
                    : { background: 'rgba(245, 245, 245,0.15)', color: 'var(--pub-gold)' }
                }
              >
                {cat.servicios.length}
              </span>
            </button>
          )
        })}
      </div>
      )}

      {/* Panel activo */}
      {activecat && (
        <div
          id={`panel-${activecat.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activecat.id}`}
        >
          {activecat.servicios.length === 0 ? (
            <p
              className="text-center py-12 text-sm"
              style={{ color: 'var(--pub-text-muted)' }}
            >
              No hay servicios activos en esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:gap-6">
              {activecat.servicios.map((s, i) => (
                <ServiceCard key={s.id} servicio={s} popular={i === 0} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA reserva global */}
      <div className="mt-14 text-center">
        <div
          className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-3xl"
          style={{ background: 'rgba(245, 245, 245,0.08)' }}
        >
          <div className="text-center sm:text-left">
            <p className="font-display text-lg font-semibold" style={{ color: 'var(--pub-text)' }}>
              Lista para tu cita?
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--pub-text-muted)' }}>
              Reserva en minutos, sin llamadas.
            </p>
          </div>
          <Link
            href={ROUTES.reservar}
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
            }}
          >
            Reservar ahora
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}