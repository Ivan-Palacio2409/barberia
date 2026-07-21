// ============================================================
// src/app/api/admin/horarios-especiales/route.ts
// Crear un horario especial — solo admin.
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
  const { fecha, hora_inicio, hora_fin, motivo } = body

  if (typeof fecha !== 'string' || typeof hora_inicio !== 'string' || typeof hora_fin !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('horarios_especiales')
    .insert({ fecha, hora_inicio, hora_fin, motivo })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}