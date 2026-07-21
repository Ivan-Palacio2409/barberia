'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// /admin/login — login dedicado para el panel administrativo.
//
// Antes /admin/login solo redirigía al login compartido de
// clientes (/login). A pedido: esta es una página totalmente
// aparte, con su propio formulario y estilo (tema oscuro/dorado
// del panel admin, sin botón de Google, sin link de registro),
// en vez de compartir la de clientes.
//
// Usa el mismo useAuth().signIn() de siempre por debajo — el
// backend de autenticación es el mismo Supabase para ambos
// roles, lo único que cambia es la pantalla. La verificación de
// que la cuenta realmente tenga rol=administrador la sigue
// haciendo middleware.ts al entrar a /admin/dashboard (si no es
// admin, te saca de ahí) — este formulario no la duplica.
// ============================================================

export default function AdminLoginPage() {
  const { signIn, user, profile, loading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesión de admin activa, saltar directo al dashboard
  useEffect(() => {
    if (!loading && user && profile?.rol === 'administrador') {
      router.replace('/admin')
    }
  }, [user, profile, loading, router])

  async function handleSubmit() {
    if (!email || !password) {
      setError('Correo y contraseña son obligatorios.')
      return
    }
    setError(null)
    setEnviando(true)
    const { error: err } = await signIn(email.trim(), password)
    setEnviando(false)
    if (err) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    router.replace('/admin')
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--pub-bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2"
            style={{ borderColor: 'var(--pub-gold-soft)', borderTopColor: 'var(--pub-gold)' }}
          />
          <p className="text-sm" style={{ color: 'var(--pub-text-dim)' }}>
            Verificando acceso...
          </p>
        </div>
      </div>
    )
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, var(--pub-surface) 0%, var(--pub-bg-soft) 100%)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'var(--pub-surface)',
          border: '1px solid var(--pub-border)',
        }}
      >
        {/* Encabezado */}
        <div className="mb-6 text-center">
          <h1
            className="font-display text-2xl font-semibold uppercase tracking-widest"
            style={{ color: 'var(--pub-gold-strong)' }}
          >
            Barbería
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--pub-text-dim)' }}>
            Panel administrativo — acceso restringido
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: 'var(--pub-red-soft)', color: '#f0a99c' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium" style={{ color: 'var(--pub-text-muted)' }}>
              Correo electrónico
            </label>
            <input
              id="email"
              name="admin-login-email"
              type="email"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin@barberia.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: 'var(--pub-surface-2)',
                border: '1px solid var(--pub-border-strong)',
                color: 'var(--pub-text)',
              }}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium" style={{ color: 'var(--pub-text-muted)' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="admin-login-password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 pr-11 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--pub-surface-2)',
                  border: '1px solid var(--pub-border-strong)',
                  color: 'var(--pub-text)',
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--pub-text-dim)' }}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? <OjoTachadoSvg /> : <OjoSvg />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--pub-gold)', color: 'var(--pub-on-gold)' }}
          >
            {enviando ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2"
                  style={{ borderColor: 'rgba(65,45,0,0.3)', borderTopColor: 'var(--pub-on-gold)' }}
                />
                Verificando...
              </>
            ) : (
              'Ingresar al panel'
            )}
          </button>
        </div>
      </div>
    </main>
  )
}

// ── Íconos ───────────────────────────────────────────────────

function OjoSvg() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function OjoTachadoSvg() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.6 20.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a20.5 20.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}