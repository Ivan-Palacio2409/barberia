'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { countNotificacionesPendientesClient } from '@/services/notificaciones-admin'
import { useNotificacionesAdminRealtime } from '@/hooks/useNotificacionesAdminRealtime'

// ============================================================
// CampanaNotificaciones.tsx — Fase 28
// Campana del navbar admin con contador en vivo. Recibe el
// conteo inicial calculado en el servidor (sin parpadeo al
// cargar la pagina) y lo mantiene actualizado via Realtime,
// sin necesidad de recargar.
// ============================================================

interface CampanaNotificacionesProps {
  pendientesInicial: number
}

export function CampanaNotificaciones({ pendientesInicial }: CampanaNotificacionesProps) {
  const [pendientes, setPendientes] = useState(pendientesInicial)
  const recargaPendiente = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recontar = useCallback(() => {
    if (recargaPendiente.current) clearTimeout(recargaPendiente.current)
    recargaPendiente.current = setTimeout(async () => {
      const nuevoConteo = await countNotificacionesPendientesClient()
      setPendientes(nuevoConteo)
    }, 400)
  }, [])

  // Cualquier cambio en notificaciones (nueva, marcada como enviada,
  // eliminada) puede mover el contador de pendientes — recontamos.
  useNotificacionesAdminRealtime(() => {
    recontar()
  })

  return (
    <Link
      href="/admin/notificaciones"
      className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title={pendientes > 0 ? `${pendientes} notificaciones pendientes` : 'Notificaciones'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {pendientes > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {pendientes > 99 ? '99+' : pendientes}
        </span>
      )}
    </Link>
  )
}
