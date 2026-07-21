'use server'

import { revalidatePath } from 'next/cache'
import { crearCitaManual } from '@/services/calendario'
import type { NuevaCitaManualInput } from '@/types'

// ============================================================
// src/app/actions/admin-calendario.ts — Fase 18
// Server Actions para el calendario administrativo.
// ============================================================

export async function actionCrearCitaManual(
  input: NuevaCitaManualInput
): Promise<{ citaId?: string; error?: string }> {
  try {
    const citaId = await crearCitaManual(input)
    revalidatePath('/admin/calendario')
    revalidatePath('/admin')
    return { citaId }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al crear la cita.' }
  }
}
