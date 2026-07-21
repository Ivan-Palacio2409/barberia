'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// UserMenu — Fase 7
// Dropdown que muestra el avatar y nombre del usuario
// autenticado con opciones: Mis citas, Mi perfil, Cerrar sesión.
// Cuando no hay sesión muestra botón de Iniciar sesión.
// ============================================================

export function UserMenu() {
  const { user, profile, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
  }

  if (!user || !profile) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Iniciar sesión
      </Link>
    )
  }

  const initials = profile.nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {profile.foto_perfil ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.foto_perfil}
            alt={profile.nombre}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {profile.nombre.split(' ')[0]}
        </span>
        <ChevronSvg open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
        >
          {/* Header del menú */}
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-800">{profile.nombre}</p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>

          {/* Opciones */}
          <div className="py-1">
            <MenuItem href="/cliente/mis-citas" onClick={() => setOpen(false)}>
              <CalendarSvg />
              Mis citas
            </MenuItem>
            <MenuItem href="/cliente/perfil" onClick={() => setOpen(false)}>
              <ProfileSvg />
              Mi perfil
            </MenuItem>
            {profile.rol === 'administrador' && (
              <MenuItem href="/admin" onClick={() => setOpen(false)}>
                <AdminSvg />
                Panel admin
              </MenuItem>
            )}
          </div>

          {/* Cerrar sesión */}
          <div className="border-t border-gray-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false)
                await signOut()
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <SignOutSvg />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers internos ──────────────────────────────────────────

function MenuItem({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      {children}
    </Link>
  )
}

function ChevronSvg({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#292421" strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke="#292421" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ProfileSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="#292421" strokeWidth="1.5" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#292421" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AdminSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="#292421" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="#292421" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="#292421" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="#292421" strokeWidth="1.5" />
    </svg>
  )
}

function SignOutSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="16 17 21 12 16 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}