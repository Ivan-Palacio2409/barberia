'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { crearClienteEInscribirse } from '@/services/lista-espera-ssr'
import { checkRateLimitDistributed } from '@/lib/rate-limit'

export interface InscribirInvitadoState {
  ok: boolean
  error?: string
}

export async function inscribirInvitadoAction(
  formData: FormData
): Promise<InscribirInvitadoState> {
  // Auditoría enterprise: este action es público y sin autenticación
  // (invitados sin cuenta) — mismo riesgo que crearCitaCompleta, así
  // que se aplica el mismo patrón de límite distribuido (migración
  // 037) por IP. Un poco más permisivo (10/10min) porque el costo de
  // abuso acá es menor (una fila en lista_espera, sin subida de
  // archivos).
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'desconocida'

  const supabase = await createClient()

  const { allowed } = await checkRateLimitDistributed(supabase, `lista-espera-invitado:${ip}`, {
    windowMs: 10 * 60_000,
    max: 10,
  })
  if (!allowed) {
    return { ok: false, error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' }
  }

  const nombre = (formData.get('nombre') as string | null)?.trim() ?? ''
  const telefono = (formData.get('telefono') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() || undefined
  const fecha_solicitada = (formData.get('fecha_solicitada') as string | null)?.trim() ?? ''
  const servicios_deseados = (formData.get('servicios_deseados') as string | null)?.trim() || undefined

  if (!nombre || nombre.length < 2) return { ok: false, error: 'El nombre es obligatorio.' }
  if (!telefono || telefono.length < 7) return { ok: false, error: 'El teléfono es obligatorio.' }
  if (!fecha_solicitada) return { ok: false, error: 'La fecha es obligatoria.' }

  // No aceptar fechas pasadas
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (new Date(fecha_solicitada) < hoy) {
    return { ok: false, error: 'La fecha no puede ser en el pasado.' }
  }

  return crearClienteEInscribirse({
    nombre,
    telefono,
    email,
    fecha_solicitada,
    servicios_deseados,
  })
}
