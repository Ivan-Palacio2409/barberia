import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { countNotificacionesPendientes } from '@/services/notificaciones-admin-ssr'
import { CampanaNotificaciones } from './CampanaNotificaciones'
import { CerrarSesionBoton } from './CerrarSesionBoton'
import { AdminMobileMenuButton } from './AdminMobileMenuButton'
import { hoyLegible } from '@/lib/date-utils'

// ============================================================
// AdminNavbar.tsx — Fase 24
// Barra superior con nombre del admin, campana de
// notificaciones pendientes y acceso rapido al perfil.
// Server Component — los datos se leen en el servidor.
// ============================================================

export async function AdminNavbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let nombreAdmin = 'Administrador'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .single()
    if (profile?.nombre) nombreAdmin = profile.nombre
  }

  const pendientes = await countNotificacionesPendientes()

  const hoy = hoyLegible()

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between gap-2 px-3 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <AdminMobileMenuButton />
        <p className="text-sm text-muted-foreground capitalize truncate">{hoy}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Campana de notificaciones pendientes — Fase 28: en vivo */}
        <CampanaNotificaciones pendientesInicial={pendientes} />

        <span className="hidden sm:inline text-sm text-foreground font-medium">{nombreAdmin}</span>

        {/* Avatar / perfil */}
        <Link
          href="/admin/configuracion"
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors shrink-0"
          title="Configuracion"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>

        <CerrarSesionBoton />
      </div>
    </header>
  )
}