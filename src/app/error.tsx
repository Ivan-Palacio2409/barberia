'use client'

// ============================================================
// src/app/error.tsx
// Auditoría enterprise (Revisión 6 — disponibilidad): sin este
// archivo, un error no controlado en cualquier página muestra la
// pantalla de error genérica y fea de Next.js (o, en producción,
// una página en blanco). Este boundary cubre toda la app excepto
// errores lanzados desde el propio layout raíz (para eso está
// global-error.tsx). Debe ser un Client Component — restricción
// de Next.js para error.tsx.
// ============================================================

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

function AlertIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function ErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Punto de observabilidad: cuando se conecte Sentry/Logtail
    // (ver src/lib/logger.ts), esto es lo que queda visible en el
    // dashboard de errores en producción.
    logger.error('[ErrorBoundary]', error.message, { digest: error.digest, stack: error.stack })
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: '#fae8e8', color: '#292421' }}
        >
          <AlertIcon />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Algo salió mal
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Tuvimos un problema inesperado. Podés intentar de nuevo o volver
            al inicio — tu información no se perdió.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground/70">
              Código de referencia: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: '#292421' }}
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold border border-border transition-opacity hover:opacity-90 active:scale-95"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
