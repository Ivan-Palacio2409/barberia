// ============================================================
// src/app/api/admin/dias-bloqueados/route.ts
// Bloquear una fecha — solo admin.
// Verificación por sesión (cookies) + escritura con service role
// (bypassa RLS). Ver src/lib/supabase/admin-guard.ts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json()
  const { fecha, motivo } = body

  if (typeof fecha !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('dias_bloqueados')
    .insert({ fecha, motivo })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}