'use client'

import { useState } from 'react'
import type { Resena } from '@/types'

interface Props {
  resenas: Resena[]
  promedio: number
}

function Stars({ puntuacion, size = 16 }: { puntuacion: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${puntuacion} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={s <= puntuacion ? 'var(--pub-gold)' : 'none'}
          stroke="var(--pub-gold)"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function getInitials(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export function ReviewsCarousel({ resenas, promedio }: Props) {
  const [active, setActive] = useState(0)

  if (resenas.length === 0) return null

  const prev = () => setActive((a) => (a === 0 ? resenas.length - 1 : a - 1))
  const next = () => setActive((a) => (a === resenas.length - 1 ? 0 : a + 1))

  return (
    <section className="py-20 lg:py-28 overflow-hidden" aria-labelledby="resenas-titulo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-2 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--pub-gold)' }}>
              Lo que dicen
            </p>
            <h2 id="resenas-titulo" className="font-display text-4xl lg:text-5xl font-semibold" style={{ color: 'var(--pub-text)' }}>
              Clientes que confían en nosotros
            </h2>

            <div className="flex items-center gap-4 p-5 rounded-xl pub-card">
              <div className="text-center shrink-0">
                <p className="font-display text-4xl font-semibold" style={{ color: 'var(--pub-text)' }}>
                  {promedio.toFixed(1)}
                </p>
                <Stars puntuacion={Math.round(promedio)} size={13} />
                <p className="text-xs mt-1" style={{ color: 'var(--pub-text-muted)' }}>
                  {resenas.length} reseña{resenas.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-px self-stretch" style={{ background: 'var(--pub-border)' }} />
              <div className="space-y-2 flex-1">
                {[5, 4, 3].map((n) => {
                  const count = resenas.filter((r) => r.puntuacion === n).length
                  const pct = resenas.length > 0 ? (count / resenas.length) * 100 : 0
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs w-3 text-right shrink-0" style={{ color: 'var(--pub-text-muted)' }}>
                        {n}
                      </span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,245,245,0.07)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--pub-gold)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                className="tap-target rounded-lg border transition-colors hover:border-[var(--pub-gold)] hover:text-[var(--pub-gold)]"
                style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text-muted)' }}
                aria-label="Reseña anterior"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-sm tabular-nums" style={{ color: 'var(--pub-text-muted)' }}>
                {active + 1} / {resenas.length}
              </span>
              <button
                type="button"
                onClick={next}
                className="tap-target rounded-lg border transition-colors hover:border-[var(--pub-gold)] hover:text-[var(--pub-gold)]"
                style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text-muted)' }}
                aria-label="Siguiente reseña"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="lg:col-span-3" aria-live="polite" aria-atomic="true">
            <blockquote className="relative pub-card rounded-2xl p-8 lg:p-10">
              <Stars puntuacion={resenas[active].puntuacion} size={16} />

              <p className="mt-5 text-lg leading-relaxed font-medium" style={{ color: 'var(--pub-text)' }}>
                {resenas[active].comentario ?? 'Excelente servicio, muy recomendado.'}
              </p>

              <footer className="mt-6 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: 'var(--pub-gold-soft)', color: 'var(--pub-gold)' }}
                  aria-hidden="true"
                >
                  {getInitials(resenas[active].cliente?.nombre ?? 'C')}
                </div>
                <div>
                  <cite className="not-italic font-semibold text-sm" style={{ color: 'var(--pub-text)' }}>
                    {resenas[active].cliente?.nombre ?? 'Cliente'}
                  </cite>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--pub-text-muted)' }}>
                    {new Date(resenas[active].created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </footer>
            </blockquote>

            <div className="flex justify-center gap-1.5 mt-6" aria-hidden="true">
              {resenas.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === active ? 20 : 6,
                    height: 6,
                    background: i === active ? 'var(--pub-gold)' : 'rgba(245,245,245,0.15)',
                  }}
                  aria-label={`Ir a reseña ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
