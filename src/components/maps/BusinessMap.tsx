'use client'

interface Props {
  /** Coordenadas del negocio. Por defecto: dirección fija de BARBERÍA. */
  lat?: number
  lng?: number
  zoom?: number
  /** Texto de dirección a mostrar debajo del mapa (opcional) */
  direccion?: string
}

// Ubicación fija del negocio (ajustar aquí si el negocio se traslada).
const DEFAULT_LAT = 7.7733418
const DEFAULT_LNG = -72.8142374

/**
 * Mapa embebido de Google Maps SIN necesidad de API key.
 * Usa el endpoint público "output=embed" (el mismo mecanismo que
 * usan sitios como maps.google.com/maps?q=lat,lng&output=embed),
 * más un botón "Cómo llegar" que abre la app/web de Google Maps
 * con direcciones, también sin key.
 */
export function BusinessMap({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  zoom = 17,
  direccion,
}: Props) {
  const embedSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&ie=UTF8&output=embed`
  const comoLlegarHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  const verEnMapsHref = `https://maps.google.com/?q=${lat},${lng}`

  return (
    <div className="w-full h-full min-h-[380px] flex flex-col">
      <iframe
        src={embedSrc}
        width="100%"
        height="100%"
        style={{ minHeight: 320, border: 0, display: 'block', flex: 1 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación de BARBERÍA en Google Maps"
      />
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        style={{ background: 'var(--pub-surface-2, #26201a)' }}
      >
        {direccion && (
          <p className="text-sm font-medium" style={{ color: 'var(--pub-text, #f4ede1)' }}>
            {direccion}
          </p>
        )}
        <div className="flex gap-3 ml-auto">
          <a
            href={verEnMapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold underline underline-offset-2"
            style={{ color: 'var(--pub-text-muted, #a99a89)' }}
          >
            Ver en Google Maps
          </a>
          <a
            href={comoLlegarHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold underline underline-offset-2"
            style={{ color: 'var(--pub-gold, #cc9f56)' }}
          >
            Cómo llegar →
          </a>
        </div>
      </div>
    </div>
  )
}