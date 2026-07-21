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
  signInWithGoogle: () => Promise<{ error: string | null }>
  getClienteId: () => Promise<string | null>
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

  // ── Sign out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [supabase])

  // ── Google OAuth ─────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [supabase])

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
  }
}
