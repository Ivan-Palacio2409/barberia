// ============================================================
// src/lib/disponibilidad-utils.ts
// Auditoría enterprise: mismo problema que servicios-ssr.ts, pero
// al revés — estas son funciones PURAS (sin acceso a base de
// datos) que vivían en services/disponibilidad.ts junto a
// getSlotsDisponibles()/getFechasDisponibles(), que sí usan el
// cliente de servidor (next/headers). Varios Client Components del
// flujo de reserva (ReservaResumen.tsx, ReservaStep3Horario.tsx,
// ReservaStep6Confirmacion.tsx) solo necesitan formatFechaLarga(),
// pero al importarla desde services/disponibilidad.ts arrastraban
// next/headers al bundle de cliente y rompían el build de
// producción.
//
// services/disponibilidad.ts importa estas mismas funciones desde
// acá para su uso interno — no se duplicó lógica.
// ============================================================

/** Convierte "HH:MM" a minutos desde medianoche */
export function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Convierte minutos a "HH:MM" */
export function toTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Devuelve el nombre de día en español abreviado para un ISO date.
 */
export function nombreDia(iso: string): string {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const d = new Date(iso + 'T12:00:00')
  return dias[d.getDay()]
}

/**
 * Formatea ISO date a "D de Mes" en español.
 */
export function formatFechaLarga(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
