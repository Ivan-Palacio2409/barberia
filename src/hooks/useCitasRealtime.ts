'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CitaCalendario } from '@/types'

// ============================================================
// useCitasRealtime.ts — Fase 18
// Suscripcion Realtime a cambios en la tabla `citas`.
// Solo activa cuando el componente esta montado.
// RLS garantiza que el canal solo recibe datos del admin.
//
// REQUISITO: Habilitar Realtime en Supabase:
//   Dashboard > Database > Replication > citas → activar
// ============================================================

type RealtimeHandler = (cita: Partial<CitaCalendario>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void

export function useCitasRealtime(onCambio: RealtimeHandler) {
  const handlerRef = useRef(onCambio)
  handlerRef.current = onCambio

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-citas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citas',
        },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          const cita = (payload.new ?? payload.old ?? {}) as Partial<CitaCalendario>
          handlerRef.current(cita, eventType)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
