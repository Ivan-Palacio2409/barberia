'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { getNotificacionesAdminClient, getResumenNotificacionesClient } from '@/services/notificaciones-admin'
import { useNotificacionesAdminRealtime } from '@/hooks/useNotificacionesAdminRealtime'
import type { NotificacionConCliente } from '@/services/notificaciones-admin'
import type { CanalNotificacion, TipoNotificacion } from '@/types'
import { TIMEZONE_NEGOCIO } from '@/lib/date-utils'

// ============================================================
// NotificacionesAdminShell.tsx — Fase 24
// Panel admin: historial de notificaciones, filtros.
//
// Ajuste: se quitaron las columnas "Estado" y "Accion" (y con
// ellas "Marcar enviada") a pedido — la tabla ahora solo muestra
// Cliente, Tipo y Programada.
//
// Fix fecha: formatFechaHora() no indicaba `timeZone`, así que
// en un servidor en UTC (Vercel) una notificacion programada
// tarde en la noche en Colombia se mostraba con la fecha del
// dia siguiente. Se fija a America/Bogota (mismo criterio que
// date-utils.ts).
// ============================================================

interface Props {
  notificaciones: NotificacionConCliente[]
  resumen: {
    pendientes: number
    enviadas_hoy: number
    total: number
    por_canal: { email: number; whatsapp: number; ambos: number }
  }
}

const TIPOS_LABEL: Record<TipoNotificacion, string> = {
  confirmacion_cita:        'Confirmacion de cita',
  nueva_reserva_admin:      'Nueva reserva (admin)',
  nueva_resena_admin:       'Nueva resena (admin)',
  recordatorio_24_horas:    'Recordatorio 24h',
  recordatorio_mismo_dia:   'Recordatorio mismo dia',
  recordatorio_1_hora:      'Recordatorio 1h antes',
  resumen_diario_admin:     'Resumen diario (admin)',
  reagendamiento_cita:      'Reagendamiento',
  cancelacion_cita:         'Cancelacion',
  solicitud_resena:         'Solicitud de resena',
  aviso_lista_espera:       'Aviso lista de espera',
  solicitud_eliminacion_cuenta: 'Solicitud ARCO: eliminación de cuenta',
}

function formatFechaHora(s: string) {
  return new Date(s).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: TIMEZONE_NEGOCIO,
  })
}

// Fase 28: punto verde "en vivo" — mismo patron usado en mis-citas
function RealtimeDot({ activo }: { activo: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2" title={activo ? 'Sincronizacion en tiempo real activa' : 'Conectando...'}>
      {activo && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', activo ? 'bg-green-500' : 'bg-muted-foreground/30')} />
    </span>
  )
}

export function NotificacionesAdminShell({ notificaciones: inicial, resumen: resumenInicial }: Props) {
  const [notificaciones, setNotificaciones] = useState(inicial)
  const [resumen, setResumen] = useState(resumenInicial)
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pendiente' | 'enviado'>('todas')
  const [filtroCanal, setFiltroCanal] = useState<CanalNotificacion | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const [, startTransition] = useTransition()
  const [realtimeActivo, setRealtimeActivo] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)
  const recargaPendiente = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fase 28: recarga lista + resumen desde el servidor (con debounce
  // corto, para evitar multiples llamadas si llegan varios eventos juntos)
  const recargarDesdeServidor = useCallback(() => {
    if (recargaPendiente.current) clearTimeout(recargaPendiente.current)
    recargaPendiente.current = setTimeout(async () => {
      const [nuevasNotificaciones, nuevoResumen] = await Promise.all([
        getNotificacionesAdminClient(),
        getResumenNotificacionesClient(),
      ])
      startTransition(() => {
        setNotificaciones(nuevasNotificaciones)
        setResumen(nuevoResumen)
      })
    }, 400)
  }, [])

  // Fase 28 — Realtime: nuevas notificaciones programadas, o
  // cambios de estado (ej. otra sesion admin marca "enviada").
  useNotificacionesAdminRealtime((notificacion, tipo) => {
    setRealtimeActivo(true)

    if (tipo === 'DELETE') {
      if (notificacion.id) {
        setNotificaciones(prev => prev.filter(n => n.id !== notificacion.id))
      }
      recargarDesdeServidor()
      return
    }

    if (tipo === 'INSERT') {
      // Llega sin el join de cliente; recargamos para tener el nombre completo
      if (notificacion.id) {
        setFlashId(notificacion.id)
        setTimeout(() => setFlashId(null), 2500)
      }
      recargarDesdeServidor()
      return
    }

    // UPDATE — actualizar campos escalares localmente, conservando
    // el cliente ya cargado, y refrescar el resumen en segundo plano
    if (notificacion.id) {
      setNotificaciones(prev =>
        prev.map(n => (n.id === notificacion.id ? { ...n, ...notificacion } : n))
      )
      setFlashId(notificacion.id)
      setTimeout(() => setFlashId(null), 2000)
    }
    recargarDesdeServidor()
  })

  const filtradas = notificaciones.filter(n => {
    const okEstado =
      filtroEstado === 'todas' ||
      (filtroEstado === 'enviado' && n.enviado) ||
      (filtroEstado === 'pendiente' && !n.enviado)
    const okCanal = !filtroCanal || n.canal === filtroCanal
    const nombreCliente = n.cliente?.nombre ?? 'Cliente eliminado'
    const okBusqueda = !busqueda ||
      nombreCliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      (n.cliente?.email ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (n.cliente?.telefono ?? '').includes(busqueda)
    return okEstado && okCanal && okBusqueda
  })

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historial de notificaciones programadas y enviadas a clientes.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 shrink-0">
          <RealtimeDot activo={realtimeActivo} />
          <span className="hidden sm:inline">En vivo</span>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Pendientes ahora</p>
          <p className="text-2xl font-bold text-amber-600">{resumen.pendientes}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Enviadas hoy</p>
          <p className="text-2xl font-bold text-green-600">{resumen.enviadas_hoy}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total historico</p>
          <p className="text-2xl font-bold text-foreground">{resumen.total}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Por canal</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{resumen.por_canal.email}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">WhatsApp</span>
              <span className="font-medium">{resumen.por_canal.whatsapp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Busqueda */}
        <div className="relative flex-1 min-w-48">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por cliente, email o telefono..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Estado */}
        <div className="flex rounded-lg border border-border bg-card overflow-hidden shrink-0">
          {(['todas', 'pendiente', 'enviado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={cn(
                'px-4 py-2 text-sm capitalize transition-colors border-r border-border last:border-r-0',
                filtroEstado === f
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Canal */}
        <select
          value={filtroCanal}
          onChange={e => setFiltroCanal(e.target.value as CanalNotificacion | '')}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 shrink-0"
        >
          <option value="">Todos los canales</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="ambos">Ambos</option>
        </select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtradas.length} {filtradas.length === 1 ? 'notificacion' : 'notificaciones'}
        </span>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-3">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p className="text-sm text-muted-foreground">No hay notificaciones con estos filtros.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Cabecera — solo desktop */}
          <div className="hidden md:grid md:grid-cols-[2fr_1.3fr_180px] gap-4 px-5 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Programada</span>
          </div>

          <div className="divide-y divide-border">
            {filtradas.map(n => (
              <div
                key={n.id}
                className={cn(
                  'px-5 py-4 transition-colors hover:bg-muted/10',
                  flashId === n.id && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
                  'md:grid md:grid-cols-[2fr_1.3fr_180px] md:gap-4 md:items-center'
                )}
              >
                {/* Cliente */}
                <div className="mb-2 md:mb-0">
                  <p className="font-medium text-sm text-foreground">{n.cliente?.nombre ?? 'Cliente eliminado'}</p>
                  <p className="text-xs text-muted-foreground">{n.cliente?.email ?? n.cliente?.telefono ?? '—'}</p>
                </div>

                {/* Tipo */}
                <div className="mb-2 md:mb-0">
                  <p className="text-xs text-foreground leading-snug">
                    {TIPOS_LABEL[n.tipo] ?? n.tipo}
                  </p>
                </div>

                {/* Fecha programada */}
                <div>
                  <p className="text-xs text-muted-foreground">{formatFechaHora(n.fecha_programada)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}