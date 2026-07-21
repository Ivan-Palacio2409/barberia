// ============================================================
// src/services/lista-espera-ssr.ts
// Auditoría enterprise: mismo problema que servicios-ssr.ts —
// crearClienteEInscribirse() usaba el cliente de servidor
// (next/headers) pero vivía en services/lista-espera.ts, archivo
// que también importan Client Components (InscripcionCard.tsx,
// FormularioAutenticado.tsx). Se separa a su propio módulo,
// consumido únicamente por app/actions/lista-espera.ts ('use server').
// ============================================================

import { createClient as createServerClient } from '@/lib/supabase/server'

export interface InscribirseInvitadoParams {
  nombre: string
  telefono: string
  email?: string
  fecha_solicitada: string
  servicios_deseados?: string
}

export async function crearClienteEInscribirse(
  params: InscribirseInvitadoParams
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient()

  // 1. Buscar cliente existente por email o teléfono
  let clienteId: string | null = null

  if (params.email) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', params.email)
      .maybeSingle()
    clienteId = data?.id ?? null
  }

  if (!clienteId) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', params.telefono)
      .maybeSingle()
    clienteId = data?.id ?? null
  }

  // 2. Si no existe, crear cliente invitado
  if (!clienteId) {
    const { data: nuevo, error: errCliente } = await supabase
      .from('clientes')
      .insert({
        nombre: params.nombre,
        telefono: params.telefono,
        email: params.email ?? null,
      })
      .select('id')
      .single()

    if (errCliente || !nuevo) {
      return { ok: false, error: 'No se pudo registrar el cliente.' }
    }
    clienteId = nuevo.id
  }

  // 3. Inscribir en lista de espera
  const { error } = await supabase.from('lista_espera').insert({
    cliente_id: clienteId,
    fecha_solicitada: params.fecha_solicitada,
    servicios_deseados: params.servicios_deseados ?? null,
  })

  if (error) {
    return { ok: false, error: 'No se pudo crear la solicitud.' }
  }

  return { ok: true }
}
