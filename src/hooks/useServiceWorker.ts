'use client'

// ============================================================
// src/hooks/useServiceWorker.ts — Fase 29
// Registra el service worker y expone el estado de
// actualización disponible para mostrar el toast.
// ============================================================

import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [updateDisponible, setUpdateDisponible] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setRegistration(reg)

        // Detectar SW en espera (actualización disponible)
        if (reg.waiting) {
          setUpdateDisponible(true)
        }

        reg.addEventListener('updatefound', () => {
          const nuevoSW = reg.installing
          if (!nuevoSW) return
          nuevoSW.addEventListener('statechange', () => {
            if (nuevoSW.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateDisponible(true)
            }
          })
        })
      })
      .catch(() => {
        // SW no disponible (dev mode, HTTP, etc) — ignorar silenciosamente
      })
  }, [])

  const aplicarActualizacion = () => {
    if (!registration?.waiting) return
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }

  return { updateDisponible, aplicarActualizacion }
}
