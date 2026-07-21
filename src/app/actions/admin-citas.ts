'use server'

import { revalidatePath } from 'next/cache'
import { confirmarCitaAdmin, completarCitaAdmin } from '@/services/dashboard'

// ============================================================
// src/app/actions/admin-citas.ts — Fase 17
// Server Actions para acciones rápidas del dashboard.
// El middleware garantiza que solo llegan peticiones de admin.
// ============================================================

export async function actionConfirmarCita(citaId: string): Promise<{ error?: string }> {
  try {
    await confirmarCitaAdmin(citaId)
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al confirmar la cita.' }
  }
}

export async function actionCompletarCita(citaId: string): Promise<{ error?: string }> {
  try {
    await completarCitaAdmin(citaId)
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al completar la cita.' }
  }
}
