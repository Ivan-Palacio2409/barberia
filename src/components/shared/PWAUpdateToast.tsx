'use client'

// ============================================================
// src/components/shared/PWAUpdateToast.tsx — Fase 29
// Toast que aparece cuando hay una nueva versión disponible.
// Permite al usuario aplicar la actualización al instante.
// ============================================================

import { useServiceWorker } from '@/hooks/useServiceWorker'

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

export function PWAUpdateToast() {
  const { updateDisponible, aplicarActualizacion } = useServiceWorker()

  if (!updateDisponible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-3.5 shadow-xl"
      style={{ minWidth: '300px', maxWidth: 'calc(100vw - 2rem)' }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: '#fae8e8', color: '#292421' }}
      >
        <RefreshIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Nueva version disponible</p>
        <p className="text-xs text-muted-foreground">Actualiza para obtener las ultimas mejoras</p>
      </div>
      <button
        onClick={aplicarActualizacion}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#292421' }}
      >
        Actualizar
      </button>
    </div>
  )
}
