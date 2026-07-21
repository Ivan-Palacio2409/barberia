'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notificacion } from '@/types'

// ============================================================
// useNotificacionesAdminRealtime.ts — Fase 28
// Suscripcion Realtime a cambios en la tabla `notificaciones`,
// para el panel admin. RLS garantiza que el canal solo entrega
// filas a usuarios con rol administrador (ver migracion 027).
//
// REQUISITO: Realtime habilitado en Supabase para la tabla
// "notificaciones" (ya activado en la migracion 027_notificaciones
// _rls_realtime.sql — ALTER PUBLICATION supabase_realtime ADD
// TABLE notificaciones).
//
// CORRECCION: este hook lo usan a la vez NotificacionesAdminShell
// (la pagina /admin/notificaciones) y CampanaNotificaciones (en
// AdminNavbar, presente en TODAS las paginas del admin). Antes
// ambos se suscribian a un canal con el MISMO nombre fijo
// ('admin-notificaciones-realtime'), y al montarse juntos (ej. al
// entrar a /admin/notificaciones) Supabase Realtime rechazaba la
// segunda suscripcion con "cannot add `postgres_changes` callbacks
// ... after `subscribe()`". Cada instancia del hook ahora usa un
// nombre de canal unico, para que puedan coexistir sin chocar.
// ============================================================

type RealtimeHandler = (
  notificacion: Partial<Notificacion>,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
) => void

let contadorInstancias = 0

export function useNotificacionesAdminRealtime(onCambio: RealtimeHandler) {
  const handlerRef = useRef(onCambio)
  handlerRef.current = onCambio

  // Id estable por instancia del hook (una por componente montado),
  // generado una sola vez con useRef para no cambiar entre renders.
  const idInstanciaRef = useRef<number | null>(null)
  if (idInstanciaRef.current === null) {
    contadorInstancias += 1
    idInstanciaRef.current = contadorInstancias
  }

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`admin-notificaciones-realtime-${idInstanciaRef.current}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
        },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          const notificacion = (payload.new ?? payload.old ?? {}) as Partial<Notificacion>
          handlerRef.current(notificacion, eventType)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}