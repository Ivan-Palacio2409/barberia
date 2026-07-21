// ============================================================
// lib/supabase/admin-guard.ts
//
// Verificación de admin para Route Handlers (API routes), usando
// el cliente de servidor (@/lib/supabase/server — lee la sesión
// desde las cookies de la petición vía next/headers).
//
// Esta función SOLO verifica identidad/rol. No la uses para hacer
// la escritura en la base de datos — para eso, cada ruta crea su
// propio cliente con createServiceRoleClient() (service-role.ts),
// que ignora RLS. Así la escritura nunca depende de que la sesión
// del navegador esté sincronizada correctamente — solo depende de
// las cookies de la petición HTTP, el mismo mecanismo que ya usa
// middleware.ts para proteger /admin.
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AdminGuardOk = { ok: true }
type AdminGuardFail = { ok: false; response: NextResponse }

export async function requireAdmin(): Promise<AdminGuardOk | AdminGuardFail> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'administrador') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }),
    }
  }

  return { ok: true }
}