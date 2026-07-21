// ============================================================
// src/app/admin/layout.tsx — Fase 17
// Layout del panel de administracion con sidebar y navbar.
// Protegido por middleware: solo profiles.rol = 'administrador'.
//
// /admin/login es una pagina aparte, con su propio diseño de
// pantalla completa (ver src/app/admin/login/page.tsx) -- no
// debe llevar el sidebar ni el navbar del panel.
//
// Este layout (Server Component) sigue renderizando
// <AdminSidebar /> y <AdminNavbar /> aca (AdminNavbar es un
// Server Component async que lee la sesion con next/headers,
// por eso tiene que ejecutarse en un Server Component), pero les
// pasa el control de "mostrarse o no" a AdminShell (Client
// Component), que decide con usePathname() -- ver el comentario
// largo en AdminShell.tsx para el porque completo.
// ============================================================

import { AdminShell } from '@/components/admin/AdminShell'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminNavbar } from '@/components/admin/AdminNavbar'

export const metadata = {
  title: 'Panel Admin | BARBERÍA',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell sidebar={<AdminSidebar />} navbar={<AdminNavbar />}>
      {children}
    </AdminShell>
  )
}