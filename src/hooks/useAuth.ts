'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

// ============================================================
// useAuth — Fase 7
// Hook centralizado de autenticación. Expone:
//   user, profile, session, loading
//   signIn, signOut, signInWithGoogle, getClienteId
// El rol se lee siempre desde profiles (no desde JWT).
// ============================================================

interface UseAuthReturn {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    nombre: string,
    telefono?: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  signInWithGoogle: (next?: string) => Promise<{ error: string | null }>
  getClienteId: () => Promise<string | null>
  refreshProfile: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: string | null }>
}

export function useAuth(): UseAuthReturn {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data as Profile)
      }
    },
    [supabase]
  )

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  // ── Sign in con email/contraseña ─────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    },
    [supabase]
  )

  // ── Registro ─────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, nombre: string, telefono?: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, telefono: telefono ?? '', rol: 'cliente' },
        },
      })
      if (error) return { error: error.message }
      return { error: null }
    },
    [supabase]
  )

  // ── Reenviar correo de confirmación ──────────────────────────
  // Cuando el login falla porque la cuenta existe pero el correo
  // aún no fue confirmado, Supabase devuelve "Email not confirmed"
  // (que antes se mostraba como "correo o contraseña incorrectos",
  // muy confuso). Este helper deja reenviar el correo desde /login.
  const resendConfirmation = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) return { error: error.message }
      return { error: null }
    },
    [supabase]
  )

  // ── Sign out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [supabase])

  // ── Google OAuth ─────────────────────────────────────────────
  // `next` es la ruta a la que se vuelve después del login (ej.
  // '/reservar' cuando el login se dispara desde el paso 4 del
  // flujo de reserva). /auth/callback ya sabe leer este parámetro
  // y redirigir ahí una vez intercambiado el code por la sesión.
  const signInWithGoogle = useCallback(
    async (next?: string) => {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      if (next) callbackUrl.searchParams.set('next', next)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) return { error: error.message }
      return { error: null }
    },
    [supabase]
  )

  // ── Refrescar el profile del usuario actual sin recargar la pagina ──
  // Se usa despues de guardar cambios (ej. EditarPerfilForm) para que
  // el nombre/telefono/foto se actualicen de una vez en toda la UI
  // que consume useAuth().profile.
  const refreshProfile = useCallback(async () => {
    if (!user) return
    await fetchProfile(user.id)
  }, [user, fetchProfile])

  // ── Obtener cliente_id del usuario actual ────────────────────
  const getClienteId = useCallback(async (): Promise<string | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (error || !data) return null
    return data.id
  }, [supabase, user])

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    getClienteId,
    refreshProfile,
    resendConfirmation,
  }
}