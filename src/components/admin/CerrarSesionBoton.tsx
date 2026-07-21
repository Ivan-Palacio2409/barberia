'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// CerrarSesionBoton.tsx
// Botón de cerrar sesión para el panel admin. No existía uno acá
// — AdminNavbar.tsx solo tenía un link a Configuración, sin
// ninguna opción para salir de la sesión.
//
// Tras signOut() se fuerza una recarga completa (no solo
// router.push) a /admin/login: así el navegador vuelve a pedir
// todas las cookies desde cero y no queda ningún estado de
// sesión stale dando vueltas en el cliente. Antes mandaba a
// /login (el login de clientes) — se corrige para que el admin
// vuelva a su propio login, no al compartido con los clientes.
// ============================================================

export function CerrarSesionBoton() {
  const [saliendo, setSaliendo] = useState(false)

  async function cerrarSesion() {
    setSaliendo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      disabled={saliendo}
      title="Cerrar sesión"
      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-red-100 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  )
}