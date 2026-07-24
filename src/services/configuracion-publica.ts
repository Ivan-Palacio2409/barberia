import { createClient } from '@/lib/supabase/server'
import type { ConfiguracionNegocio } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: configuracion-publica
// Igual que services/configuracion.ts, pero pensado para
// Server Components del sitio público (Footer, ContactSection):
// usa el cliente de servidor (@/lib/supabase/server), no el de
// navegador, que no funciona fuera de un Client Component.
// ============================================================

export async function getConfiguracionPublica(): Promise<ConfiguracionNegocio | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Error al obtener configuración pública:', error.message)
    return null
  }

  return data as ConfiguracionNegocio | null
}

// ── Helpers para construir los enlaces a partir de lo que
//    el admin configuró en /admin/configuracion ──────────────

function limpiarHandle(valor?: string | null): string {
  return (valor ?? '').trim().replace(/^@/, '')
}

export function urlInstagram(handle?: string | null): string | null {
  const limpio = limpiarHandle(handle)
  return limpio ? `https://instagram.com/${limpio}` : null
}

export function urlTiktok(handle?: string | null): string | null {
  const limpio = limpiarHandle(handle)
  return limpio ? `https://www.tiktok.com/@${limpio}` : null
}

export function urlWhatsapp(telefono?: string | null): string | null {
  const digitos = (telefono ?? '').replace(/\D/g, '')
  return digitos ? `https://wa.me/${digitos}` : null
}