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

// ============================================================
// Aritmética de fechas sin "cálculos sueltos".
//
// Patrón detectado en auditoría (jul 2026): varios componentes
// hacían `const d = new Date(); d.setDate(d.getDate() + n);
// d.toISOString().slice(0, 10)` para calcular "dentro de N días".
// Eso mezcla la hora actual (con minutos/segundos) con una
// conversión a UTC: si son, por ejemplo, las 8:00 p.m. hora
// Bogota (ya es el día siguiente en UTC), el resultado queda
// corrido un día extra respecto de lo esperado.
//
// Estas dos funciones operan solo sobre el componente de fecha
// (YYYY-MM-DD), con aritmética en UTC puro (Date.UTC +
// setUTCDate/setUTCMonth), sin ninguna dependencia de la hora del
// dia ni de la zona horaria del entorno donde corran. Siempre se
// les debe pasar una fecha ya anclada a Bogota (ej. hoyISO()).
// ============================================================

/** Suma (o resta, si es negativo) `dias` a una fecha YYYY-MM-DD, sin depender de la hora ni de la zona horaria del runtime. */
export function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const fecha = new Date(Date.UTC(y, m - 1, d))
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

/** Suma (o resta, si es negativo) `meses` a una fecha YYYY-MM-DD, sin depender de la hora ni de la zona horaria del runtime. */
export function sumarMeses(fechaISO: string, meses: number): string {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const fecha = new Date(Date.UTC(y, m - 1, d))
  fecha.setUTCMonth(fecha.getUTCMonth() + meses)
  return fecha.toISOString().slice(0, 10)
}