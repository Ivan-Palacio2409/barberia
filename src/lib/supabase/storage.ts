// ============================================================
// storage.ts — Fase 6
// Helper centralizado para Supabase Storage.
// [C8] uploadImage verifica consentimiento de fotografías
//      antes de permitir subidas al bucket estilos-referencia.
// ============================================================

import { createClient } from '@/lib/supabase/client'
import { LEGAL_VERSIONS } from '@/constants/legal'

// ── Buckets disponibles ──────────────────────────────────────
export const BUCKETS = {
  ESTILOS_REFERENCIA: 'estilos-referencia', // privado — fotos de citas
  CATALOGO:           'catalogo-estilos',   // público — galería del negocio
  SERVICIOS:          'servicios-fotos',    // público — fotos de servicios
  NEGOCIO:            'negocio-assets',     // público — logo y activos
} as const

export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS]

// ── Límites ──────────────────────────────────────────────────
export const MAX_FILE_SIZE  = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp'] as const

// ── Validación local ─────────────────────────────────────────
export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return 'Tipo de archivo no permitido. Solo JPEG, PNG o WebP.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'El archivo supera el límite de 5 MB.'
  }
  return null
}

// ── Upload ────────────────────────────────────────────────────
/**
 * Sube un archivo a Storage y devuelve la URL pública (o path para signed URL).
 *
 * [C8] Si el bucket es `estilos-referencia`, verifica que el cliente
 * haya aceptado el consentimiento de `almacenamiento_fotografias` con
 * la versión vigente antes de proceder.
 */
export async function uploadImage(
  bucket: Bucket,
  file: File,
  path: string,
  clienteId?: string,
): Promise<string> {
  const error = validateFile(file)
  if (error) throw new Error(error)

  const supabase = createClient()

  // [C8] Verificar consentimiento de fotografías
  if (bucket === BUCKETS.ESTILOS_REFERENCIA) {
    if (!clienteId) {
      throw new Error('Se requiere clienteId para subir fotografías de referencia.')
    }
    const { data: consentimiento } = await supabase
      .from('consentimientos')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('tipo_consentimiento', 'almacenamiento_fotografias')
      .eq('version_documento', LEGAL_VERSIONS.FOTOGRAFIAS)
      .eq('aceptado', true)
      .maybeSingle()

    if (!consentimiento) {
      throw new Error(
        'Se requiere consentimiento de almacenamiento de fotografías para subir imágenes.',
      )
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  if (bucket === BUCKETS.ESTILOS_REFERENCIA) {
    // Devuelve el path; la URL firmada se obtiene al leer
    return path
  }

  return getPublicUrl(bucket, path)
}

// ── Delete ────────────────────────────────────────────────────
export async function deleteImage(bucket: Bucket, path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}

// ── URL pública ───────────────────────────────────────────────
export function getPublicUrl(bucket: Bucket, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ── Signed URL (para bucket privado) ─────────────────────────
export async function getSignedUrl(
  bucket: Bucket,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

// ── Generar nombre único ──────────────────────────────────────
export function generateFilePath(userId: string, file: File): string {
  const ext   = file.name.split('.').pop() ?? 'jpg'
  const stamp = Date.now()
  const rand  = Math.random().toString(36).slice(2, 8)
  return `${userId}/${stamp}-${rand}.${ext}`
}
