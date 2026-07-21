'use server'

import { revalidatePath } from 'next/cache'
import { marcarEnviadaAdmin, programarNotificacionAdmin } from '@/services/notificaciones-admin-ssr'
import type { CanalNotificacion, TipoNotificacion } from '@/types'

// ============================================================
// src/app/actions/notificaciones-admin.ts — Fase 24
// Server Actions para el panel admin de notificaciones.
// ============================================================

export async function actionMarcarEnviada(id: string): Promise<{ error?: string }> {
  const result = await marcarEnviadaAdmin(id)
  if (!result.ok) return { error: result.error }
  revalidatePath('/admin/notificaciones')
  return {}
}

export async function actionProgramarNotificacion(params: {
  cliente_id: string
  tipo: TipoNotificacion
  canal: CanalNotificacion
  cita_id?: string
  fecha_programada: string
}): Promise<{ error?: string }> {
  const result = await programarNotificacionAdmin(params)
  if (!result.ok) return { error: result.error }
  revalidatePath('/admin/notificaciones')
  return {}
}
