// ============================================================
// src/lib/rate-limit.ts — Fase 30 / Auditoría enterprise
// Rate limiting simple en memoria para rutas API publicas.
// Cada instancia de servidor tiene su propio estado —
// para produccion multi-instancia usar Upstash Redis.
// Limite: 60 requests/minuto por IP.
// ============================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000 // 1 minuto
const MAX_REQUESTS = 60

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}

// ── Variante configurable, para acciones más sensibles ────────
// Auditoría enterprise: crearCitaCompleta() es una Server Action
// pública sin autenticación que escribe en la base de datos y
// sube archivos a Storage, y no tenía NINGÚN límite — un script
// podía llamarla en loop y generar citas/uploads sin freno. Se
// usa un store separado (`storeAcciones`) para no compartir
// contador con el límite general de 60/min de las rutas de solo
// lectura (disponibilidad/slots).
const storeAcciones = new Map<string, RateLimitEntry>()

export function checkRateLimitConfig(
  key: string,
  opts: { windowMs: number; max: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = storeAcciones.get(key)

  if (!entry || now > entry.resetAt) {
    storeAcciones.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.max - 1 }
  }

  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: opts.max - entry.count }
}

// ── Variante distribuida (Postgres) ────────────────────────────
// Auditoría enterprise: el Map en memoria de arriba es por-instancia
// — en un entorno con más de un servidor/función activa a la vez,
// cada una tiene su propio contador. checkRateLimitDistributed()
// usa la función check_rate_limit_db() (migración 037), que vive en
// Postgres y por lo tanto es compartida entre todas las instancias.
//
// Estrategia de dos pasos para no pagar un round-trip a la base de
// datos en cada request:
//   1. Chequeo rápido en memoria (gratis). Si ya bloquea acá, ni
//      siquiera se llama a la base de datos — la instancia actual ya
//      sabe que hay que rechazar.
//   2. Si el chequeo local permite, se confirma contra Postgres (la
//      verdad compartida), porque otra instancia pudo haber agotado
//      la cuota real aunque esta instancia todavía no lo sepa.
//
// Requiere un cliente de Supabase ya inicializado (se pasa desde
// afuera para no acoplar este archivo a next/headers ni a un
// contexto server-only específico).
interface SupabaseRpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ data: boolean | null; error: { message: string } | null }>
}

export async function checkRateLimitDistributed(
  supabase: SupabaseRpcClient,
  key: string,
  opts: { windowMs: number; max: number }
): Promise<{ allowed: boolean }> {
  const local = checkRateLimitConfig(key, opts)
  if (!local.allowed) {
    return { allowed: false }
  }

  const { data, error } = await supabase.rpc('check_rate_limit_db', {
    p_key: key,
    p_window_seconds: Math.ceil(opts.windowMs / 1000),
    p_max: opts.max,
  })

  if (error) {
    // Si Postgres no responde, no tumbamos la funcionalidad por un
    // problema de infraestructura secundario — se cae de vuelta al
    // chequeo en memoria (ya sabemos que permitió llegar hasta acá).
    return { allowed: true }
  }

  return { allowed: data === true }
}

// Limpiar entradas expiradas periodicamente
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key)
    }
    for (const [key, entry] of storeAcciones.entries()) {
      if (now > entry.resetAt) storeAcciones.delete(key)
    }
  }, WINDOW_MS * 2)
}
