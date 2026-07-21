'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

// ============================================================
// AdminSidebarContext.tsx
//
// El sidebar del panel admin (AdminSidebar.tsx) es fijo (w-60)
// y siempre visible, sin importar el ancho de pantalla. En
// mobile eso deja el contenido real comprimido en una franja
// angosta (títulos y tarjetas cortados / superpuestos).
//
// Esta solución lo convierte en un panel deslizable (off-canvas)
// en mobile: oculto por defecto, se abre con un botón hamburguesa
// en el AdminNavbar y se cierra con overlay/click afuera/al
// navegar. En desktop (lg+) sigue fijo y visible como antes.
//
// AdminSidebar y AdminNavbar se renderizan por separado (uno es
// Server Component async, el otro Client) y se pasan como props
// ya resueltos a AdminShell — por eso el estado "abierto/cerrado"
// vive en un Context que envuelve a ambos desde AdminShell, en
// vez de pasarse por props directas.
// ============================================================

interface AdminSidebarState {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

const AdminSidebarContext = createContext<AdminSidebarState | null>(null)

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cerrar el panel automáticamente al navegar a otra sección
  // (evita que quede abierto tapando la pantalla tras un click).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <AdminSidebarContext.Provider value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}>
      {children}
    </AdminSidebarContext.Provider>
  )
}

export function useAdminSidebar() {
  const ctx = useContext(AdminSidebarContext)
  if (!ctx) {
    throw new Error('useAdminSidebar debe usarse dentro de AdminSidebarProvider')
  }
  return ctx
}