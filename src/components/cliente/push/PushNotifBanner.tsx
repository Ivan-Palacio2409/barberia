'use client'

// ============================================================
// src/components/cliente/push/PushNotifBanner.tsx — Fase 30
// Banner en el perfil del cliente para activar / desactivar
// las notificaciones push del navegador (Web Push).
// Se oculta en dispositivos sin soporte o con permiso denegado
// a nivel de sistema operativo.
// ============================================================

import { usePushNotifications } from '@/hooks/usePushNotifications'

// ── Iconos SVG ───────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function BellOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

interface Props {
  clienteId: string | null
}

export function PushNotifBanner({ clienteId }: Props) {
  const { estado, cargando, suscribir, desuscribir } = usePushNotifications(clienteId)

  // No mostrar si no hay soporte o el permiso fue bloqueado en SO
  if (estado === 'sin_soporte' || estado === 'denegado' || estado === 'desconocido') {
    if (estado === 'denegado') {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 text-amber-500 shrink-0"><BellOffIcon /></span>
          <div>
            <p className="text-sm font-medium text-amber-800">Notificaciones bloqueadas</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Habilitaste el bloqueo en tu navegador. Para recibir alertas de tus citas, permite las notificaciones en la configuracion del sitio.
            </p>
          </div>
        </div>
      )
    }
    if (estado === 'sin_soporte') return null
    // desconocido — mostrar banner de activacion
  }

  if (estado === 'suscrito') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 shrink-0"><CheckCircleIcon /></span>
          <div>
            <p className="text-sm font-medium text-emerald-800">Notificaciones activas</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Te avisaremos cuando tu cita sea confirmada o este proxima.
            </p>
          </div>
        </div>
        <button
          onClick={desuscribir}
          disabled={cargando}
          className="shrink-0 text-xs font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2 disabled:opacity-50 transition-opacity"
        >
          {cargando ? 'Desactivando...' : 'Desactivar'}
        </button>
      </div>
    )
  }

  // Estado 'concedido' o 'desconocido' — invitar a suscribir
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-stone-400 shrink-0"><BellIcon /></span>
        <div>
          <p className="text-sm font-medium text-stone-700">Recibe alertas de tus citas</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Activa las notificaciones para saber cuando tu cita es confirmada o esta proxima.
          </p>
        </div>
      </div>
      <button
        onClick={suscribir}
        disabled={cargando || !clienteId}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: '#292421' }}
      >
        {cargando ? 'Activando...' : 'Activar'}
      </button>
    </div>
  )
}
