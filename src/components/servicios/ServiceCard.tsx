import type { Servicio } from '@/types'

function formatPrice(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio)
}

interface Props {
  servicio: Servicio
  popular?: boolean
}

export function ServiceCard({ servicio: s, popular = false }: Props) {
  const descripcion = s.descripcion?.trim()
    || 'Servicio realizado por nuestro equipo profesional, con atención personalizada de principio a fin.'

  return (
    <article className="pub-glass flex min-h-[340px] flex-col justify-between overflow-hidden rounded-2xl p-7 lg:min-h-[280px] lg:rounded-lg lg:p-6">
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--pub-gold-soft, rgba(212,175,102,0.14))' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--pub-gold-strong)"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="6" cy="18" r="2.2" />
              <circle cx="6" cy="6" r="2.2" />
              <path d="M7.8 7.4 L20 18 M7.8 16.6 L20 6" strokeLinecap="round" />
            </svg>
          </span>

          {popular && (
            <span
              className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: 'var(--pub-gold-soft, rgba(212,175,102,0.14))',
                color: 'var(--pub-gold-strong)',
              }}
            >
              Popular
            </span>
          )}
        </div>

        <h3
          className="font-display mb-2 text-lg font-semibold leading-snug"
          style={{ color: 'var(--pub-text)' }}
        >
          {s.nombre}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--pub-text-muted)' }}>
          {descripcion}
        </p>
      </div>

      <div className="mt-8 flex items-end justify-between border-t pt-8 lg:mt-6 lg:pt-6" style={{ borderColor: 'var(--pub-border)' }}>
        {/* Duración */}
        <div className="flex flex-col">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--pub-text-muted)' }}
          >
            Duración
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--pub-text)' }}>
            {s.duracion_minutos} min
          </span>
        </div>

        {/* Precio */}
        <div className="text-right">
          <span
            className="block text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--pub-text-muted)' }}
          >
            Inversión
          </span>
          <span className="font-display text-lg" style={{ color: 'var(--pub-gold-strong)' }}>
            {formatPrice(s.precio)}
          </span>
        </div>
      </div>
    </article>
  )
}