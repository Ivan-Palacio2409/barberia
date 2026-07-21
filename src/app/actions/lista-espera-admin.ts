'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cambiarEstadoListaEspera } from '@/services/lista-espera-admin'

// ============================================================
// src/app/actions/lista-espera-admin.ts — Fase 23
// Server Actions para gestión admin de lista de espera.
// ============================================================

async function getAdminId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function actionNotificarListaEspera(
  id: string
): Promise<{ error?: string }> {
  const adminId = await getAdminId()
  if (!adminId) return { error: 'No autenticado.' }

  const result = await cambiarEstadoListaEspera(id, 'notificado', adminId)
  if (!result.ok) return { error: result.error }

  revalidatePath('/admin/lista-espera')
  return {}
}

export async function actionConvertirListaEspera(
  id: string
): Promise<{ error?: string }> {
  const adminId = await getAdminId()
  if (!adminId) return { error: 'No autenticado.' }

  const result = await cambiarEstadoListaEspera(id, 'convertido', adminId)
  if (!result.ok) return { error: result.error }

  revalidatePath('/admin/lista-espera')
  return {}
}

export async function actionCancelarListaEspera(
  id: string
): Promise<{ error?: string }> {
  const adminId = await getAdminId()
  if (!adminId) return { error: 'No autenticado.' }

  const result = await cambiarEstadoListaEspera(id, 'cancelado', adminId)
  if (!result.ok) return { error: result.error }

  revalidatePath('/admin/lista-espera')
  return {}
}

export async function actionRestaurarListaEspera(
  id: string
): Promise<{ error?: string }> {
  const adminId = await getAdminId()
  if (!adminId) return { error: 'No autenticado.' }

  const result = await cambiarEstadoListaEspera(id, 'en_espera', adminId)
  if (!result.ok) return { error: result.error }

  revalidatePath('/admin/lista-espera')
  return {}
}
