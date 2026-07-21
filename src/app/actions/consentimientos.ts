'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LEGAL_VERSIONS } from '@/constants/legal'
import type { TipoConsentimiento } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// Server Action — registrarConsentimientoServidor
// [C8] Ley 1581/2012 y Decreto 1377/2013 (Colombia)
//
// Se ejecuta en el servidor para:
//   1. Obtener la IP real del cliente (no disponible en client).
//   2. Evitar duplicados: si ya existe un registro vigente para
//      la versión actual, no se inserta otro.
//   3. Usar el service role client solo server-side.
// ============================================================

interface RegistrarConsentimientoParams {
  clienteId: string
  tipo: TipoConsentimiento
}

export async function registrarConsentimientoServidor({
  clienteId,
  tipo,
}: RegistrarConsentimientoParams): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Versión vigente del documento según el tipo
  const versionDocumento =
    tipo === 'tratamiento_datos'
      ? LEGAL_VERSIONS.PRIVACIDAD
      : LEGAL_VERSIONS.FOTOGRAFIAS

  // Verificar si ya existe un consentimiento vigente (evitar duplicados)
  const { data: existente } = await supabase
    .from('consentimientos')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('tipo_consentimiento', tipo)
    .eq('version_documento', versionDocumento)
    .eq('aceptado', true)
    .limit(1)
    .maybeSingle()

  if (existente) {
    // Ya tiene consentimiento vigente — no duplicar
    return { ok: true }
  }

  // Obtener IP del cliente desde los headers del request
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'desconocida'

  const { error } = await supabase.from('consentimientos').insert({
    cliente_id: clienteId,
    tipo_consentimiento: tipo,
    version_documento: versionDocumento,
    aceptado: true,
    ip,
  })

  if (error) {
    logger.error('[consentimiento] Error al registrar:', error.message)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
