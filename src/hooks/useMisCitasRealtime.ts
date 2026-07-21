'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CitaConServicios } from '@/types'

// ============================================================
// useMisCitasRealtime.ts — Fase 23
// Suscripcion Realtime a cambios en las citas del cliente.
// Filtra por cliente_id para que solo reciba sus propias citas.
// Actualiza la lista local optimisticamente cuando llega un evento.
//
// REQUISITO: Realtime habilitado en Supabase para tabla "citas"
//   Dashboard > Database > Replication > citas → activar
// ============================================================

type CitaCambioHandler = (
  cita: Partial<CitaConServicios>,
  tipo: 'INSERT' | 'UPDATE' | 'DELETE'
) => void

export function useMisCitasRealtime(
  clienteId: string | null,
  onCambio: CitaCambioHandler
) {
  const handlerRef = useRef(onCambio)
  handlerRef.current = onCambio

  useEffect(() => {
    if (!clienteId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`cliente-citas-${clienteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citas',
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload) => {
          const tipo = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          const cita = (payload.new ?? payload.old ?? {}) as Partial<CitaConServicios>
          handlerRef.current(cita, tipo)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clienteId])
}
