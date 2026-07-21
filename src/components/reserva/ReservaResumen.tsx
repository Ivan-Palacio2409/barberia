'use client'

import { useReserva } from '@/hooks/useReserva'
import { formatFechaLarga } from '@/lib/disponibilidad-utils'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

export function ReservaResumen() {
  const { serviciosSeleccionados, fechaSeleccionada, horaInicio, datosCliente, duracionTotal, precioTotal } =
    useReserva()

  const total = precioTotal()
  const duracion = duracionTotal()

  if (serviciosSeleccionados.length === 0) return null

  return (
    <aside
      className="rounded-2xl p-5 space-y-4 border"
      style={{
        background: 'rgba(245, 245, 245,0.06)',
        borderColor: 'rgba(245, 245, 245,0.2)',
      }}
      aria-label="Resumen de tu reserva"
    >
      <h3
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--pub-gold)' }}
      >
        Tu reserva
      </h3>

      {/* Servicios */}
      <ul className="space-y-2">
        {serviciosSeleccionados.map(({ servicio }) => (
          <li key={servicio.id} className="flex justify-between items-start gap-3 text-sm">
            <span style={{ color: 'var(--pub-text)' }}>{servicio.nombre}</span>
            <span className="shrink-0 font-medium" style={{ color: 'var(--pub-gold)' }}>
              {formatPrice(servicio.precio)}
            </span>
          </li>
        ))}
      </ul>

      <hr style={{ borderColor: 'rgba(245, 245, 245,0.2)' }} />

      {/* Duración */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--pub-text-muted)' }}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Duracion total: <strong style={{ color: 'var(--pub-text)' }}>{duracion} min</strong>
      </div>

      {/* Fecha / hora si ya fue seleccionada */}
      {fechaSeleccionada && (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--pub-text-muted)' }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatFechaLarga(fechaSeleccionada)}
          {horaInicio && (
            <span className="ml-1 font-semibold" style={{ color: 'var(--pub-text)' }}>
              {horaInicio}
            </span>
          )}
        </div>
      )}

      {/* Cliente si ya completó paso 4 */}
      {datosCliente && (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--pub-text-muted)' }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="font-medium" style={{ color: 'var(--pub-text)' }}>
            {datosCliente.nombre}
          </span>
        </div>
      )}

      <hr style={{ borderColor: 'rgba(245, 245, 245,0.2)' }} />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: 'var(--pub-text)' }}>
          Total estimado
        </span>
        <span className="text-lg font-bold" style={{ color: 'var(--pub-gold)' }}>
          {formatPrice(total)}
        </span>
      </div>
    </aside>
  )
}
