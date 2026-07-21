'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebarProvider } from './AdminSidebarContext'

// ============================================================
// AdminShell.tsx
//
// AdminSidebar es un Client Component, pero AdminNavbar es un
// Server Component ASYNC (usa next/headers a traves de
// @/lib/supabase/server para leer la sesion). Un Client
// Component no puede importar y renderizar directamente un
// Server Component async -- eso es justo el error de build
// "You're importing a component that needs next/headers" que
// salio al probar la primera version de este archivo (que hacia
// `import { AdminNavbar } from './AdminNavbar'` aca adentro).
//
// La forma correcta de mezclar esto es el patron de "slots": el
// Server Component padre (admin/layout.tsx) renderiza
// <AdminSidebar /> y <AdminNavbar /> y los pasa como PROPS
// (ya resueltos) a este Client Component, que solo decide, con
// usePathname(), si los muestra o no. Este componente nunca los
// importa ni los ejecuta -- solo los recibe listos.
//
// Por que segue resolviendo el bug original (sidebar/login
// superpuestos): el pathname se lee con el hook usePathname(),
// que SI se re-evalua en cada navegacion del lado del cliente
// (a diferencia de headers() en un Server Component, que no se
// re-ejecuta si Next.js reusa el layout entre navegaciones). Que
// las props sidebar/navbar vengan de un render "viejo" del
// layout no importa: son siempre el mismo sidebar/navbar (no
// dependen de la ruta actual), asi que no hay nada "stale" que
// se note.
// ============================================================

interface AdminShellProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  navbar: React.ReactNode
}

export function AdminShell({ children, sidebar, navbar }: AdminShellProps) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <AdminSidebarProvider>
      <div className="admin-theme flex min-h-screen bg-background">
        {sidebar}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {navbar}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AdminSidebarProvider>
  )
}