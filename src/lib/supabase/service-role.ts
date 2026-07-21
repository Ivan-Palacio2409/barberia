// ============================================================
// lib/supabase/service-role.ts
// H5 (post fase 30) — arquitectura de notificaciones reales.
//
// Cliente con SUPABASE_SERVICE_ROLE_KEY: bypassa RLS. Úsalo
// SOLO en código que corre en el servidor y nunca se envía al
// navegador (Route Handlers, Edge Functions, cron jobs) — nunca
// en un Client Component ni en nada marcado 'use client'.
//
// Se usa acá porque el procesamiento de notificaciones pendientes
// corre fuera de una sesión de usuario (lo dispara un cron, no un
// click), así que no hay JWT de ningún usuario para autenticar
// contra la política "notificaciones_admin_all" (migración 012).
// ============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. ' +
        'Este cliente solo debe usarse server-side, con la service role key configurada.',
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
