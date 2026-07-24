'use client'

import { useEffect, useState } from 'react'
import { useReserva } from '@/hooks/useReserva'
import type { CategoriaServicio, Servicio } from '@/types'

interface CategoriaConServicios extends CategoriaServicio {
  servicios: Servicio[]
}

interface Props {
  categorias: CategoriaConServicios[]
  onNext: () => void
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

// ── Iconos de servicio — línea fina, estilo editorial ──────────
function IconTijeras() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="6" cy="18" r="2" />
      <circle cx="6" cy="6" r="2" />
      <path d="M7.6 7.2 L20 18 M7.6 16.8 L20 6" strokeLinecap="round" />
    </svg>
  )
}
function IconBarba() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 4 L20 4 L20 10 C20 15 16 20 12 20 C8 20 4 15 4 10 Z" />
    </svg>
  )
}
function IconHoja() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 20 C4 10 12 4 20 4 C20 12 14 20 4 20Z" />
      <path d="M5 19 L14 10" strokeLinecap="round" />
    </svg>
  )
}
function IconFacial() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <path d="M8 15 Q12 17 16 15" strokeLinecap="round" />
    </svg>
  )
}
function IconEstrella() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M12 2.5 L14.7 9 L21.5 9.5 L16.3 14 L18 20.8 L12 17 L6 20.8 L7.7 14 L2.5 9.5 L9.3 9 Z" />
    </svg>
  )
}
/** Icono por categoría — heurística sobre el nombre */
function iconForCategoria(nombre: string) {
  const n = nombre.toLowerCase()
  if (n.includes('corte')) return IconTijeras
  if (n.includes('barb')) return IconBarba
  if (n.includes('facial') || n.includes('piel')) return IconFacial
  if (n.includes('ritual') || n.includes('toalla') || n.includes('spa')) return IconHoja
  return IconEstrella
}

/** Badge opcional según reglas simples de destaque (visual, no de negocio) */
function badgeFor(
  servicio: Servicio,
  indexEnCategoria: number,
  precioMax: number
): { label: string; tone: 'popular' | 'relax' | 'signature' } | null {
  const n = `${servicio.nombre} ${servicio.descripcion ?? ''}`.toLowerCase()
  if (servicio.precio === precioMax && precioMax > 0) return { label: 'Signature', tone: 'signature' }
  if (n.includes('toalla') || n.includes('caliente') || n.includes('relaj') || n.includes('facial')) {
    return { label: 'Relajante', tone: 'relax' }
  }
  if (indexEnCategoria === 0) return { label: 'Popular', tone: 'popular' }
  return null
}

const BADGE_STYLES: Record<string, React.CSSProperties> = {
  popular: { background: 'rgba(197,160,89,0.14)', color: 'var(--pub-gold-strong)' },
  relax: { background: 'rgba(154,74,62,0.16)', color: '#d9a08f' },
  signature: { background: 'rgba(197,160,89,0.22)', color: 'var(--pub-gold-strong)' },
}

export function ReservaStep1Servicios({ categorias, onNext }: Props) {
  const { serviciosSeleccionados, toggleServicio, duracionTotal, precioTotal } = useReserva()
  const [activeCat, setActiveCat] = useState<string>(categorias[0]?.id ?? '')

  // Al entrar a la página, si el usuario aún no tiene ningún
  // servicio elegido (primera visita o carrito vacío), preseleccionar
  // el primero de la primera categoría para que pueda continuar de
  // inmediato sin tener que elegir manualmente.
  useEffect(() => {
    if (serviciosSeleccionados.length === 0 && categorias[0]?.servicios[0]) {
      toggleServicio(categorias[0].servicios[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSelected = (id: string) =>
    serviciosSeleccionados.some((s) => s.servicio.id === id)

  const canContinue = serviciosSeleccionados.length > 0
  const activecat = categorias.find((c) => c.id === activeCat)

  const precioMax = Math.max(0, ...categorias.flatMap((c) => c.servicios.map((s) => s.precio)))

  return (
    <div className="space-y-8 pb-24">
      {/* Encabezado — tipografía editorial grande, como la referencia */}
      <div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--pub-text)' }}>
          Elige tu <span style={{ color: 'var(--pub-gold-strong)' }}>Ritual</span>
        </h2>
        <p className="text-sm max-w-xl" style={{ color: 'var(--pub-text-muted)' }}>
          Selecciona los servicios que deseas incluir en tu visita. Cada experiencia está
          diseñada para ofrecer el máximo confort y precisión.
        </p>
      </div>

      {/* Tabs categoría */}
      {categorias.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Categorias">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={cat.id === activeCat}
              onClick={() => setActiveCat(cat.id)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={
                cat.id === activeCat
                  ? {
                      background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                      color: 'var(--pub-on-gold)',
                    }
                  : { background: 'var(--pub-surface-2)', color: 'var(--pub-text-muted)' }
              }
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Grid de servicios — una tarjeta por fila, a todo el ancho */}
      {activecat && (
        <div
          className="grid grid-cols-1 gap-4"
          role="group"
          aria-label={`Servicios de ${activecat.nombre}`}
        >
          {activecat.servicios.map((s, i) => {
            const selected = isSelected(s.id)
            const Icon = iconForCategoria(activecat.nombre)
            const badge = badgeFor(s, i, precioMax)

            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleServicio(s)}
                className="relative group text-left rounded-2xl p-6 border transition-all duration-300 flex flex-col"
                style={{
                  borderColor: selected ? 'var(--pub-gold)' : 'var(--pub-border-strong)',
                  background: selected
                    ? 'linear-gradient(135deg, rgba(197,160,89,0.10) 0%, var(--pub-surface) 100%)'
                    : 'linear-gradient(135deg, var(--pub-surface) 0%, var(--pub-bg-soft) 100%)',
                  boxShadow: selected ? '0 0 24px rgba(197,160,89,0.12)' : 'none',
                }}
              >
                {/* Fila superior: icono + badge */}
                <div className="flex items-start justify-between mb-6">
                  <span style={{ color: 'var(--pub-gold-strong)' }}>
                    <Icon />
                  </span>
                  {badge && (
                    <span
                      className="text-[11px] font-medium px-3 py-1 rounded-full"
                      style={BADGE_STYLES[badge.tone]}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>

                {/* Título + descripción */}
                <h3 className="font-display text-lg mb-2" style={{ color: 'var(--pub-text)' }}>
                  {s.nombre}
                </h3>
                {s.descripcion && (
                  <p className="text-sm leading-relaxed mb-6 line-clamp-3 flex-1" style={{ color: 'var(--pub-text-muted)' }}>
                    {s.descripcion}
                  </p>
                )}

                <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--pub-border-strong)' }}>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--pub-text-dim)' }}>
                        Duración
                      </p>
                      <p className="text-sm" style={{ color: 'var(--pub-text)' }}>
                        {s.duracion_minutos} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--pub-text-dim)' }}>
                        Inversión
                      </p>
                      <p className="font-display text-lg" style={{ color: 'var(--pub-gold-strong)' }}>
                        {formatPrice(s.precio)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Check de seleccionado */}
                {selected && (
                  <div
                    className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--pub-gold), var(--pub-gold-strong))' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--pub-on-gold)" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Barra inferior con total y CTA */}
      <div
        className="sticky bottom-0 -mx-5 sm:-mx-8 px-4 sm:px-8 py-4 border-t z-10"
        style={{
          background: 'rgba(18,20,20,0.92)',
          backdropFilter: 'blur(10px)',
          borderColor: 'var(--pub-border-strong)',
        }}
      >
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto lg:max-w-none">
          {canContinue ? (
            <div>
              <p className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                {serviciosSeleccionados.length}{' '}
                {serviciosSeleccionados.length === 1 ? 'servicio' : 'servicios'} —{' '}
                {duracionTotal()} min
              </p>
              <p className="text-base font-bold font-display" style={{ color: 'var(--pub-text)' }}>
                {formatPrice(precioTotal())}
              </p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
              Selecciona al menos un servicio
            </p>
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
            }}
          >
            Elegir fecha
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}