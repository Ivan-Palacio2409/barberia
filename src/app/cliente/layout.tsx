import { AuthGuard } from '@/components/auth/AuthGuard'

// ============================================================
// Layout de la sección cliente — Fase 13
// Protege todas las rutas /cliente/* con AuthGuard. El
// middleware.ts ya aplica protección en servidor (cualquier
// usuario autenticado, sin exigir un rol específico); este
// layout añade la segunda capa en el cliente para transiciones
// SPA y debe reflejar la misma regla.
//
// Corrección: antes se pedía requiredRole="cliente", así que
// una cuenta con rol=administrador (que también reserva citas
// para sí misma) era expulsada a "/" al entrar a /cliente/perfil
// o /cliente/mis-citas — "Mi perfil" en el menú del navbar
// mandaba al inicio en vez de abrir el perfil. /cliente/* no
// necesita un rol específico, solo sesión activa.
// ============================================================

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard redirectTo="/login">
      {children}
    </AuthGuard>
  )
}