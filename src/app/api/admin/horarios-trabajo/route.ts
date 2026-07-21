// ============================================================
// src/app/api/admin/horarios-trabajo/route.ts
// Crear un bloque de horario (mañana/tarde) — solo admin.
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
  const { dia_semana, bloque, hora_inicio, hora_fin } = body

  if (
    typeof dia_semana !== 'number' ||
    (bloque !== 'manana' && bloque !== 'tarde') ||
    typeof hora_inicio !== 'string' ||
    typeof hora_fin !== 'string'
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('horarios_trabajo')
    .insert({ dia_semana, bloque, hora_inicio, hora_fin, activo: true })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}