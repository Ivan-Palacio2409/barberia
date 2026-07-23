import { createClient } from '@/lib/supabase/client'
import type { ConfiguracionNegocio } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: configuracion_negocio
// Tabla de fila única — solo se hace SELECT/UPDATE, nunca INSERT.
//
// Nota (fix): antes se usaba `.single()`, que lanza el error crudo
// de Postgres "Cannot coerce the result to a single JSON object"
// si la fila esperada no aparece (por ejemplo, si el `id` con el
// que se guarda quedó desactualizado). Se cambió a `.maybeSingle()`
// en ambas funciones para poder devolver un mensaje claro en vez de
// ese error técnico. La migración 042 además garantiza que la
// tabla nunca tenga más de una fila.
// ============================================================

export async function getConfiguracion(): Promise<ConfiguracionNegocio | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Error al obtener configuración:', error.message)
    return null
  }

  return data as ConfiguracionNegocio | null
}

export async function actualizarConfiguracion(
  id: string,
  payload: Partial<Omit<ConfiguracionNegocio, 'id' | 'updated_at'>>
): Promise<{ data: ConfiguracionNegocio | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('configuracion_negocio')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    logger.error('Error al actualizar configuración:', error.message, error.code)
    return { data: null, error: error.message }
  }

  // `maybeSingle()` no lanza si no hay filas — pero para nosotros
  // sigue siendo un fallo: no se guardó nada. Esto pasa si el `id`
  // recibido ya no corresponde a la fila actual (por ejemplo, la
  // página quedó abierta desde antes de una limpieza de datos) o si
  // las políticas de RLS bloquearon el UPDATE por no ser admin.
  if (!data) {
    // Confirmamos cuál es el caso para dar un mensaje útil.
    const actual = await getConfiguracion()
    if (actual && actual.id !== id) {
      return {
        data: null,
        error: 'La configuración cambió en otra sesión. Recarga la página e intenta de nuevo.',
      }
    }
    return {
      data: null,
      error: 'No se pudo guardar: tu sesión no tiene permisos de administrador o expiró. Vuelve a iniciar sesión e intenta de nuevo.',
    }
  }

  return { data: data as ConfiguracionNegocio, error: null }
}