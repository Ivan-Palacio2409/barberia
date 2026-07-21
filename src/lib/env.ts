import { logger } from '@/lib/logger'
// ============================================================
// src/lib/env.ts — Fase 30
// Validacion de variables de entorno al inicio.
// Si falta alguna variable critica el proceso falla rapido
// con un mensaje claro en lugar de errores crípticos en runtime.
// ============================================================

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const OPTIONAL_VARS = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'WHATSAPP_API_TOKEN',
  'WHATSAPP_PHONE_ID',
  'CRON_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_WHATSAPP_PHONE',
] as const

export function validateEnv(): void {
  const missing: string[] = []

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key)
  }

  if (missing.length > 0) {
    throw new Error(
      `[BARBERÍA] Variables de entorno requeridas no definidas:\n` +
      missing.map((k) => `  - ${k}`).join('\n') +
      `\n\nCopia .env.example a .env.local y completa los valores.`
    )
  }

  // Advertencias opcionales en desarrollo
  if (process.env.NODE_ENV === 'development') {
    for (const key of OPTIONAL_VARS) {
      if (!process.env[key]) {
        logger.warn(`[BARBERÍA] Variable opcional no definida: ${key}`)
      }
    }
  }
}

// Exportar env tipado para uso seguro en el servidor
export const env = {
  supabaseUrl:       process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey:   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  siteUrl:           process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  vapidPublicKey:    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  vapidPrivateKey:   process.env.VAPID_PRIVATE_KEY ?? '',
  vapidSubject:      process.env.VAPID_SUBJECT ?? '',
} as const
