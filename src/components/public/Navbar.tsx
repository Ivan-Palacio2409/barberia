'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '@/components/auth/UserMenu'
import { ROUTES } from '@/constants'
import { ClienteNotifBell } from '@/components/shared/ClienteNotifBell'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [clienteId, setClienteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setClienteId(null); return }
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setClienteId(data?.id ?? null))
  }, [user])

  const links = [
    { href: ROUTES.servicios, label: 'Servicios' },
    { href: ROUTES.galeria,   label: 'Galería' },
    { href: ROUTES.reservar,  label: 'Reservar' },
    { href: ROUTES.resenas,   label: 'Reseñas' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(18, 20, 20, 0.9)',
        borderBottom: '1px solid var(--pub-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20 md:h-20"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2.5 shrink-0 tap-target"
          aria-label="BARBERÍA — inicio"
        >
          <span
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--pub-gold-strong)' }}
          >
            BARBERÍA
          </span>
        </Link>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className="relative py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors"
                style={{ color: active ? 'var(--pub-gold-strong)' : 'var(--pub-text-muted)' }}
              >
                {l.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -bottom-1 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: 'var(--pub-gold-strong)' }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* CTA + UserMenu desktop */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  {clienteId && <ClienteNotifBell clienteId={clienteId} />}
                  <UserMenu />
                </div>
              ) : (
                <Link
                  href={ROUTES.login}
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-white/[0.04]"
                  style={{ color: 'var(--pub-text-muted)' }}
                >
                  Iniciar sesión
                </Link>
              )}
            </>
          )}
          <Link
            href={ROUTES.reservar}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
            style={{ background: 'var(--pub-gold-strong)', color: 'var(--pub-on-gold)' }}
          >
            Reservar ahora
          </Link>
        </div>

        {/* Hamburguesa mobile */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden tap-target rounded-md"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          style={{ color: 'var(--pub-text)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Menú mobile */}
      {open && (
        <div
          className="md:hidden px-4 py-4 flex flex-col gap-1"
          style={{ background: 'var(--pub-surface)', borderTop: '1px solid var(--pub-border)' }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium py-2.5 px-1 uppercase tracking-wide"
              style={{ color: 'var(--pub-text)' }}
            >
              {l.label}
            </Link>
          ))}
          <hr className="my-2" style={{ borderColor: 'var(--pub-border)' }} />
          {!loading && !user && (
            <Link
              href={ROUTES.login}
              onClick={() => setOpen(false)}
              className="text-base font-medium py-2.5 px-1"
              style={{ color: 'var(--pub-text-muted)' }}
            >
              Iniciar sesión
            </Link>
          )}
          {!loading && user && <UserMenu />}
          <Link
            href={ROUTES.reservar}
            onClick={() => setOpen(false)}
            className="inline-flex justify-center items-center mt-2 px-5 py-3 rounded text-sm font-semibold uppercase tracking-wide"
            style={{ background: 'var(--pub-gold-strong)', color: 'var(--pub-on-gold)' }}
          >
            Reservar ahora
          </Link>
        </div>
      )}
    </header>
  )
}