'use client'

import { useAdminSidebar } from './AdminSidebarContext'

// ============================================================
// AdminMobileMenuButton.tsx
// Botón hamburguesa, visible solo en mobile (lg:hidden), que
// abre el panel lateral (AdminSidebar) convertido en drawer.
// Vive dentro de AdminNavbar (Server Component) — al ser este
// un Client Component aparte, sí puede importarse y renderizarse
// desde un Server Component sin problema (la restricción es solo
// al revés: un Client Component no puede importar un Server
// Component async).
// ============================================================

export function AdminMobileMenuButton() {
  const { toggle } = useAdminSidebar()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Abrir menú"
      className="lg:hidden -ml-1.5 p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  )
}