// ============================================================
// date-utils.ts
// Utilidades para obtener la fecha/hora "actual" siempre en la
// zona horaria del negocio (America/Bogota), sin importar en
// que zona horaria corra el servidor (Vercel usa UTC).
//
// Antes se usaba `new Date().toISOString().slice(0, 10)` en
// varios lugares. Eso calcula el dia en UTC, no en Bogota, asi
// que entre las 7:00 p.m. y las 11:59 p.m. hora Colombia
// (cuando en UTC ya es el dia siguiente) la app mostraba/
// calculaba la fecha de "manana" en vez de "hoy".
// ============================================================

export const TIMEZONE_NEGOCIO = 'America/Bogota'

/** Fecha de "hoy" en Bogota, formato YYYY-MM-DD. */
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE_NEGOCIO })
}

/** Fecha de "hoy" en Bogota como Date a medianoche (para sumar/restar dias con setDate/setMonth). */
export function hoyDate(): Date {
  return new Date(`${hoyISO()}T00:00:00`)
}

/** Hora actual en Bogota, formato HH:mm (24h). */
export function horaActualISO(): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: TIMEZONE_NEGOCIO,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Fecha de "hoy" en Bogota, en texto legible ("jueves, 23 de julio de 2026"). */
export function hoyLegible(opciones: Intl.DateTimeFormatOptions = {}): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opciones,
    timeZone: TIMEZONE_NEGOCIO,
  })
}