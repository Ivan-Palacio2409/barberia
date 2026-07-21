import { createClient } from '@/lib/supabase/client'

// ============================================================
// src/services/push.ts — Fase 30
// CRUD de suscripciones Web Push por cliente.
// ============================================================

export interface PushSuscripcion {
  id: string
  cliente_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at: string
}

export async function guardarSuscripcion(
  clienteId: string,
  suscripcion: PushSubscription,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const json = suscripcion.toJSON()

  const { error } = await supabase
    .from('push_suscripciones')
    .upsert(
      {
        cliente_id: clienteId,
        endpoint: json.endpoint!,
        p256dh: (json.keys as Record<string, string>)?.p256dh ?? '',
        auth: (json.keys as Record<string, string>)?.auth ?? '',
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 250) : null,
      },
      { onConflict: 'cliente_id,endpoint' },
    )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function eliminarSuscripcion(
  clienteId: string,
  endpoint: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('push_suscripciones')
    .delete()
    .eq('cliente_id', clienteId)
    .eq('endpoint', endpoint)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getSuscripcionesByCliente(
  clienteId: string,
): Promise<PushSuscripcion[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('push_suscripciones')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as PushSuscripcion[]
}
