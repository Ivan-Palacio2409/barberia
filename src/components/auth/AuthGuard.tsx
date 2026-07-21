'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import type { Rol } from '@/types'

// ============================================================
// AuthGuard — Fase 7
// Wrapper client-side para proteger páginas que requieren
// autenticación y/o un rol específico. El middleware protege
// las rutas a nivel de servidor; este componente añade una
// segunda capa en el cliente para transiciones SPA.
// ============================================================

interface AuthGuardProps {
  children: React.ReactNode
  /** Si se indica, el usuario debe tener este rol exacto */
  requiredRole?: Rol
  /** Ruta de redirección si no cumple el requisito */
  redirectTo?: string
  /** Contenido a mostrar mientras carga la sesión */
  fallback?: React.ReactNode
}

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = '/login',
  fallback,
}: AuthGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace(redirectTo)
      return
    }

    if (requiredRole && profile?.rol !== requiredRole) {
      router.replace('/')
    }
  }, [user, profile, loading, requiredRole, redirectTo, router])

  if (loading) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSvg />
        </div>
      )
    )
  }

  if (!user) return null
  if (requiredRole && profile?.rol !== requiredRole) return null

  return <>{children}</>
}

function LoadingSvg() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#292421"
        strokeWidth="2"
        strokeDasharray="40 20"
      />
    </svg>
  )
}
