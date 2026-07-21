// ============================================================
// src/app/api/admin/horarios-trabajo/[id]/route.ts
// Actualizar / eliminar un bloque de horario — solo admin.
// Verificación por sesión (cookies) + escritura con service role
// (bypassa RLS). Ver src/lib/supabase/admin-guard.ts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json()
  const { hora_inicio, hora_fin, activo } = body

  const patch: Record<string, unknown> = {}
  if (hora_inicio !== undefined) patch.hora_inicio = hora_inicio
  if (hora_fin !== undefined) patch.hora_fin = hora_fin
  if (activo !== undefined) patch.activo = activo

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('horarios_trabajo')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'La actualización no afectó ninguna fila (id inexistente)' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('horarios_trabajo').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}