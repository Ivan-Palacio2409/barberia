// ============================================================
// lib/maps/index.ts
// Helpers de Google Maps SIN API key (embed público + enlaces
// de direcciones), usados por BusinessMap.
// ============================================================

export interface LatLng {
  lat: number
  lng: number
}

/** URL del mapa embebido de Google Maps para unas coordenadas (sin API key). */
export function getEmbedUrl(lat: number, lng: number, zoom = 17): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&ie=UTF8&output=embed`
}

/** URL para abrir direcciones ("Cómo llegar") hacia unas coordenadas. */
export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
}

/** URL para ver el punto directamente en Google Maps. */
export function getViewUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`
}
