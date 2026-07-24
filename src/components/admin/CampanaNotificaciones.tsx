'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  getAlertasAdminClient,
  countAlertasAdminNoLeidasClient,
  marcarAlertasAdminLeidasClient,
  type AlertaAdmin,
} from '@/services/notificaciones-admin'
import { useNotificacionesAdminRealtime } from '@/hooks/useNotificacionesAdminRealtime'
import { cn } from '@/lib/utils'

// ============================================================
// CampanaNotificaciones.tsx — Fase 28, reescrito jul 2026
//
// QA jul 2026: antes esta campana era solo un link a
// /admin/notificaciones y su contador ("pendientes") en realidad
// contaba TODA la cola de envios pendientes (recordatorios,
// confirmaciones, etc.) — no tenia nada que ver con "avisos nuevos
// para la administradora". Ahora:
//
//   1. Es un dropdown (como la campana del cliente): al hacer clic
//      se ven las notificaciones ahi mismo, sin salir de la pagina.
//   2. Solo avisa de 3 eventos: nueva reserva, cancelacion de una
//      reserva, y nueva resena (los unicos que pidio la
//      administradora).
//   3. El estado "leida" se guarda en la base de datos (columna
//      notificaciones.leida, migracion 042): al abrir la campana se
//      marcan como leidas ahi mismo, y esto persiste aunque se
//      recargue la pagina o se cierre sesion. El contador solo
//      vuelve a subir cuando llega una alerta realmente nueva.
// ============================================================

const TIPOS_LABEL: Record<string, string> = {
  nueva_reserva_admin: 'Nueva reserva',
  cancelacion_cita: 'Reserva cancelada',
  nueva_resena_admin: 'Nueva reseña',
}

function formatRelativo(s: string) {
  const diff = Date.now() - new Date(s).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  if (h < 24) return `Hace ${h}h`
  return `Hace ${d}d`
}

interface CampanaNotificacionesProps {
  pendientesInicial: number
}

export function CampanaNotificaciones({ pendientesInicial }: CampanaNotificacionesProps) {
  const [alertas, setAlertas] = useState<AlertaAdmin[]>([])
  const [noLeidas, setNoLeidas] = useState(pendientesInicial)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const recargaPendiente = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cargar = useCallback(async () => {
    const [lista, conteo] = await Promise.all([
      getAlertasAdminClient(10),
      countAlertasAdminNoLeidasClient(),
    ])
    setAlertas(lista)
    setNoLeidas(conteo)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const recargar = useCallback(() => {
    if (recargaPendiente.current) clearTimeout(recargaPendiente.current)
    recargaPendiente.current = setTimeout(cargar, 400)
  }, [cargar])

  // Cualquier cambio en notificaciones puede afectar las alertas del
  // admin (nueva reserva, cancelacion, resena) — recargamos.
  useNotificacionesAdminRealtime(() => {
    recargar()
  })

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleAbrir() {
    const nuevoEstado = !open
    setOpen(nuevoEstado)
    if (nuevoEstado && noLeidas > 0) {
      // Marcar como leidas en la base de datos de inmediato (optimista
      // en la UI) para que quede persistido aunque se recargue la
      // pagina o se cierre sesion.
      setAlertas(prev => prev.map(a => ({ ...a, leida: true })))
      setNoLeidas(0)
      await marcarAlertasAdminLeidasClient()
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleAbrir}
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={noLeidas > 0 ? `${noLeidas} notificaciones nuevas` : 'Notificaciones'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
            <Link
              href="/admin/notificaciones"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {alertas.length === 0 ? (
            <div className="py-10 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-muted-foreground">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p className="text-xs text-muted-foreground">Sin notificaciones aún</p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-80 overflow-y-auto">
              {alertas.map(a => (
                <li
                  key={a.id}
                  className={cn('px-4 py-3 flex items-start gap-3', !a.leida && 'bg-muted/50')}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-primary/10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug text-foreground">
                      {TIPOS_LABEL[a.tipo] ?? a.tipo}
                      {a.cliente?.nombre ? ` — ${a.cliente.nombre}` : ''}
                    </p>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      {formatRelativo(a.fecha_programada)}
                    </p>
                  </div>
                  {!a.leida && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-primary" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}