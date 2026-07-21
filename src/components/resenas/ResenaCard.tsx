import type { Resena } from '@/types'
import { StarRating } from './StarRating'

interface ResenaCardProps {
  resena: Resena
}

function formatearFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function obtenerIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// Fase 27: icono de check para resenas con cita verificada
function VerifiedIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

// Fase 27: icono de tijeras para mostrar el servicio reseñado
function ScissorsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  )
}

export function ResenaCard({ resena }: ResenaCardProps) {
  const nombre = resena.cliente?.nombre ?? 'Cliente'
  const iniciales = obtenerIniciales(nombre)

  return (
    <article className="bg-[var(--pub-surface)] rounded-xl border border-[var(--pub-gold)]/20 p-6 flex flex-col gap-3 pub-card-hover">
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        {/* Avatar con iniciales */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[var(--pub-on-gold)] text-sm font-semibold"
          style={{ background: 'var(--pub-gold)' }}
          aria-hidden="true"
        >
          {iniciales}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--pub-text)] text-sm leading-snug truncate">
            {nombre}
          </p>
          <time
            dateTime={resena.created_at}
            className="text-xs text-[var(--pub-text-muted)]"
          >
            {formatearFecha(resena.created_at)}
          </time>
        </div>

        <StarRating value={resena.puntuacion} readonly size="sm" />
      </div>

      {/* Servicio reseñado + compra verificada — Fase 27 */}
      {(resena.cita_id || (resena.cita && resena.cita.servicios_nombres.length > 0)) && (
        <div className="flex items-center gap-2 flex-wrap">
          {resena.cita_id && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: '#eafaf0', color: '#1d8a4d' }}
            >
              <VerifiedIcon />
              Compra verificada
            </span>
          )}
          {resena.cita && resena.cita.servicios_nombres.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--pub-text-muted)]">
              <ScissorsIcon />
              {resena.cita.servicios_nombres.join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Comentario */}
      {resena.comentario && (
        <p className="text-sm text-[var(--pub-text)] leading-relaxed">
          {resena.comentario}
        </p>
      )}
    </article>
  )
}
