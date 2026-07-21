import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: profiles
// ============================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    logger.error('Error al obtener el perfil:', error.message)
    return null
  }

  return data as Profile
}

export async function updateProfile(
  userId: string,
  data: Partial<Pick<Profile, 'nombre' | 'telefono' | 'foto_perfil'>>
): Promise<Profile | null> {
  const supabase = createClient()

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar el perfil:', error.message)
    return null
  }

  return updated as Profile
}
