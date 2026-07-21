// ============================================================
// src/app/api/admin/dias-bloqueados/[id]/route.ts
// Desbloquear una fecha — solo admin.
// Verificación por sesión (cookies) + escritura con service role
// (bypassa RLS). Ver src/lib/supabase/admin-guard.ts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('dias_bloqueados').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}