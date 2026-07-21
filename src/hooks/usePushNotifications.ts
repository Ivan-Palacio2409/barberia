'use client'

// ============================================================
// src/hooks/usePushNotifications.ts — Fase 30
// Gestiona el permiso y la suscripcion Web Push del navegador.
// Guarda / elimina la suscripcion en Supabase via service layer.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { guardarSuscripcion, eliminarSuscripcion } from '@/services/push'
import { logger } from '@/lib/logger'

export type PushEstado = 'desconocido' | 'sin_soporte' | 'denegado' | 'concedido' | 'suscrito'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications(clienteId: string | null) {
  const [estado, setEstado] = useState<PushEstado>('desconocido')
  const [cargando, setCargando] = useState(false)
  const [suscripcion, setSuscripcion] = useState<PushSubscription | null>(null)

  // Detectar estado inicial al montar
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('sin_soporte')
      return
    }

    const perm = Notification.permission
    if (perm === 'denied') {
      setEstado('denegado')
      return
    }

    // Verificar si ya hay una suscripcion activa
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSuscripcion(sub)
          setEstado('suscrito')
        } else {
          setEstado(perm === 'granted' ? 'concedido' : 'desconocido')
        }
      })
    })
  }, [])

  const suscribir = useCallback(async () => {
    if (!clienteId) return
    if (!VAPID_PUBLIC_KEY) {
      logger.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurada')
      return
    }

    setCargando(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setEstado('denegado')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      setSuscripcion(sub)
      setEstado('suscrito')
      await guardarSuscripcion(clienteId, sub)
    } catch (err) {
      logger.error('[Push] Error al suscribir:', err)
    } finally {
      setCargando(false)
    }
  }, [clienteId])

  const desuscribir = useCallback(async () => {
    if (!suscripcion || !clienteId) return
    setCargando(true)
    try {
      const endpoint = suscripcion.endpoint
      await suscripcion.unsubscribe()
      setSuscripcion(null)
      setEstado('concedido')
      await eliminarSuscripcion(clienteId, endpoint)
    } catch (err) {
      logger.error('[Push] Error al desuscribir:', err)
    } finally {
      setCargando(false)
    }
  }, [suscripcion, clienteId])

  return { estado, cargando, suscribir, desuscribir }
}
