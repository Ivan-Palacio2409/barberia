// ============================================================
// src/services/resenas-ssr.ts
// Auditoría enterprise: mismo problema que servicios-ssr.ts —
// getResenasServer()/getPromedioCalificacionServer() vivían en
// services/resenas.ts, archivo que también importan Client
// Components (ModalResena.tsx, CitaCard.tsx, MisResenas.tsx,
// ResenaForm.tsx). Se separan a su propio módulo, consumido solo
// por Server Components (admin/resenas/page.tsx, (public)/resenas/page.tsx).
//
// El helper de normalización se duplica acá (en vez de importarlo
// de resenas.ts) a propósito: así este archivo no depende en
// absoluto del módulo que sí importan los Client Components.
// ============================================================

import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Resena } from '@/types'
import { logger } from '@/lib/logger'

interface ResenaConCitaRaw {
  id: string
  cliente_id: string
  cita_id?: string | null
  puntuacion: number
  comentario?: string
  created_at: string
  cliente?: { id: string; nombre: string } | null
  cita?: {
    id: string
    fecha: string
    cita_servicios?: { servicio: { nombre: string } | null }[] | null
  } | null
}

function normalizarResena(r: ResenaConCitaRaw): Resena {
  const serviciosNombres = (r.cita?.cita_servicios ?? [])
    .map((cs) => cs.servicio?.nombre)
    .filter((n): n is string => Boolean(n))

  return {
    id: r.id,
    cliente_id: r.cliente_id,
    cita_id: r.cita_id ?? null,
    puntuacion: r.puntuacion,
    comentario: r.comentario,
    created_at: r.created_at,
    cliente: r.cliente as Resena['cliente'],
    cita: r.cita
      ? { id: r.cita.id, fecha: r.cita.fecha, servicios_nombres: serviciosNombres }
      : undefined,
  }
}

const SELECT_RESENA_CON_CITA = `
  *,
  cliente:clientes(id, nombre),
  cita:citas(
    id,
    fecha,
    cita_servicios(servicio:servicios(nombre))
  )
`

export async function getResenasServer(limite?: number): Promise<Resena[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('resenas')
    .select(SELECT_RESENA_CON_CITA)
    .order('created_at', { ascending: false })

  if (limite) {
    query = query.limit(limite)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Error al obtener las reseñas (server):', error.message)
    return []
  }

  return (data as unknown as ResenaConCitaRaw[]).map(normalizarResena)
}

export async function getPromedioCalificacionServer(): Promise<{ promedio: number; total: number }> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from('resenas').select('puntuacion')

  if (error || !data || data.length === 0) {
    return { promedio: 0, total: 0 }
  }

  const suma = data.reduce((total, r) => total + r.puntuacion, 0)
  return {
    promedio: Math.round((suma / data.length) * 10) / 10,
    total: data.length,
  }
}
