import { createClient } from '@/lib/supabase/client'
import { VERSIONES_LEGALES } from '@/constants'
import type { Consentimiento, TipoConsentimiento } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: consentimientos
// [C8] Cumplimiento Ley 1581/2012 y Decreto 1377/2013 (Colombia).
// Registra y consulta el consentimiento explícito del cliente
// para tratamiento de datos y almacenamiento de fotografías.
// ============================================================

interface RegistrarConsentimientoParams {
  clienteId: string
  tipo: TipoConsentimiento
  aceptado: boolean
  ip?: string
  versionDocumento?: string
}

// Registra un nuevo consentimiento. Si no se indica versión del
// documento, usa la versión vigente definida en las constantes
// globales (VERSIONES_LEGALES), de modo que cada registro quede
// trazado contra el texto legal exacto que el cliente aceptó.
export async function registrarConsentimiento({
  clienteId,
  tipo,
  aceptado,
  ip,
  versionDocumento,
}: RegistrarConsentimientoParams): Promise<Consentimiento | null> {
  const supabase = createClient()

  const version =
    versionDocumento ??
    (tipo === 'tratamiento_datos'
      ? `privacidad-v${VERSIONES_LEGALES.politicaPrivacidad}`
      : `fotos-v${VERSIONES_LEGALES.terminosCondiciones}`)

  const { data, error } = await supabase
    .from('consentimientos')
    .insert({
      cliente_id: clienteId,
      tipo_consentimiento: tipo,
      version_documento: version,
      aceptado,
      ip,
    })
    .select()
    .single()

  if (error) {
    logger.error('Error al registrar el consentimiento:', error.message)
    return null
  }

  return data as Consentimiento
}

export async function getConsentimientosByCliente(
  clienteId: string
): Promise<Consentimiento[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consentimientos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error al obtener los consentimientos del cliente:', error.message)
    return []
  }

  return data as Consentimiento[]
}

// Verifica si el cliente tiene un consentimiento aceptado y
// vigente (misma versión del documento actual) para un tipo
// concreto. Se usa para bloquear, por ejemplo, el uploader de
// fotografías hasta que exista consentimiento vigente.
export async function tieneConsentimientoVigente(
  clienteId: string,
  tipo: TipoConsentimiento
): Promise<boolean> {
  const supabase = createClient()

  const versionVigente =
    tipo === 'tratamiento_datos'
      ? `privacidad-v${VERSIONES_LEGALES.politicaPrivacidad}`
      : `fotos-v${VERSIONES_LEGALES.terminosCondiciones}`

  const { data, error } = await supabase
    .from('consentimientos')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('tipo_consentimiento', tipo)
    .eq('version_documento', versionVigente)
    .eq('aceptado', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Error al verificar el consentimiento vigente:', error.message)
    return false
  }

  return data !== null
}
