'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EstadoBadge } from '@/components/lista-espera/EstadoBadge'
import {
  actionNotificarListaEspera,
  actionConvertirListaEspera,
  actionCancelarListaEspera,
  actionRestaurarListaEspera,
} from '@/app/actions/lista-espera-admin'
import type { ListaEsperaConCliente } from '@/services/lista-espera-admin'
import type { EstadoListaEspera } from '@/types'

// ============================================================
// ListaEsperaAdminShell.tsx — Fase 23
// Panel admin de lista de espera: tabla, filtros, acciones.
// ============================================================

interface ListaEsperaAdminShellProps {
  solicitudes: ListaEsperaConCliente[]
  resumen: {
    en_espera: number
    notificado: number
    convertido: number
    cancelado: number
    total: number
  }
}

type FiltroEstado = EstadoListaEspera | 'todas'

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: 'todas',      label: 'Todas' },
  { id: 'en_espera',  label: 'En espera' },
  { id: 'notificado', label: 'Notificadas' },
  { id: 'convertido', label: 'Convertidas' },
  { id: 'cancelado',  label: 'Canceladas' },
]

function formatFecha(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatFechaCorta(s: string) {
  return new Date(s).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short',
  })
}

// Boton de accion individual
function AccionBtn({
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'success' | 'danger' | 'muted'
  disabled?: boolean
}) {
  const styles = {
    default:  'border-primary/30 text-primary hover:bg-primary/5',
    success:  'border-green-300 text-green-700 hover:bg-green-50',
    danger:   'border-red-300 text-red-600 hover:bg-red-50',
    muted:    'border-border text-muted-foreground hover:bg-muted',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        styles[variant]
      )}
    >
      {label}
    </button>
  )
}

export function ListaEsperaAdminShell({
  solicitudes: inicial,
  resumen,
}: ListaEsperaAdminShellProps) {
  const [solicitudes, setSolicitudes] = useState(inicial)
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [accionId, setAccionId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtradas = solicitudes.filter(s => {
    const okEstado = filtro === 'todas' || s.estado === filtro
    const okBusqueda = !busqueda ||
      s.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.cliente.telefono.includes(busqueda) ||
      s.fecha_solicitada.includes(busqueda)
    return okEstado && okBusqueda
  })

  function actualizarEstado(id: string, nuevoEstado: EstadoListaEspera) {
    setSolicitudes(prev =>
      prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s)
    )
  }

  async function ejecutarAccion(
    id: string,
    accion: () => Promise<{ error?: string }>,
    nuevoEstado: EstadoListaEspera
  ) {
    setAccionId(id)
    setErrorMsg(null)
    const result = await accion()
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      startTransition(() => actualizarEstado(id, nuevoEstado))
    }
    setAccionId(null)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lista de espera</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de solicitudes de clientes para fechas sin disponibilidad.
        </p>
      </div>

      {/* Error global */}
      {errorMsg && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'En espera',  value: resumen.en_espera,  color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Notificadas', value: resumen.notificado, color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Convertidas', value: resumen.convertido, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Canceladas',  value: resumen.cancelado,  color: 'text-red-500',    bg: 'bg-red-50'    },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', c.bg)}>
              <span className={cn('text-sm font-bold', c.color)}>{c.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + busqueda */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Busqueda */}
        <div className="relative flex-1 min-w-48">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, telefono o fecha..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Filtros estado */}
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                filtro === f.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtradas.length} {filtradas.length === 1 ? 'solicitud' : 'solicitudes'}
        </span>
      </div>

      {/* Tabla / Lista */}
      {filtradas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-3">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <p className="text-sm text-muted-foreground">No hay solicitudes con este filtro.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Cabecera tabla — solo en desktop */}
          <div className="hidden md:grid md:grid-cols-[1fr_140px_120px_180px_160px] gap-4 px-5 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Cliente</span>
            <span>Fecha solicitada</span>
            <span>Estado</span>
            <span>Servicios deseados</span>
            <span className="text-right">Acciones</span>
          </div>

          <div className="divide-y divide-border">
            {filtradas.map(s => {
              const enProgreso = accionId === s.id
              return (
                <div
                  key={s.id}
                  className={cn(
                    'px-5 py-4 transition-colors',
                    enProgreso && 'opacity-60 pointer-events-none',
                    'md:grid md:grid-cols-[1fr_140px_120px_180px_160px] md:gap-4 md:items-center'
                  )}
                >
                  {/* Cliente */}
                  <div className="mb-3 md:mb-0">
                    <p className="font-medium text-sm text-foreground">{s.cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.cliente.telefono}</p>
                    {s.cliente.email && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.cliente.email}</p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="mb-3 md:mb-0">
                    <p className="text-sm text-foreground font-medium hidden md:block">
                      {formatFechaCorta(s.fecha_solicitada)}
                    </p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      Fecha: {formatFecha(s.fecha_solicitada)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recibida: {formatFechaCorta(s.created_at)}
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="mb-3 md:mb-0">
                    <EstadoBadge estado={s.estado} />
                  </div>

                  {/* Servicios */}
                  <div className="mb-3 md:mb-0">
                    {s.servicios_deseados ? (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {s.servicios_deseados}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">No especificados</span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-1.5 md:justify-end">
                    {/* Ver cliente */}
                    <Link
                      href={`/admin/clientes/${s.cliente.id}`}
                      className="px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Ver cliente
                    </Link>

                    {/* Notificar — solo si en_espera */}
                    {s.estado === 'en_espera' && (
                      <AccionBtn
                        label="Notificar"
                        variant="default"
                        disabled={enProgreso}
                        onClick={() => ejecutarAccion(
                          s.id,
                          () => actionNotificarListaEspera(s.id),
                          'notificado'
                        )}
                      />
                    )}

                    {/* Convertir — si en_espera o notificado */}
                    {(s.estado === 'en_espera' || s.estado === 'notificado') && (
                      <AccionBtn
                        label="Convertir"
                        variant="success"
                        disabled={enProgreso}
                        onClick={() => ejecutarAccion(
                          s.id,
                          () => actionConvertirListaEspera(s.id),
                          'convertido'
                        )}
                      />
                    )}

                    {/* Cancelar — si activa */}
                    {(s.estado === 'en_espera' || s.estado === 'notificado') && (
                      <AccionBtn
                        label="Cancelar"
                        variant="danger"
                        disabled={enProgreso}
                        onClick={() => ejecutarAccion(
                          s.id,
                          () => actionCancelarListaEspera(s.id),
                          'cancelado'
                        )}
                      />
                    )}

                    {/* Restaurar — si cancelado */}
                    {s.estado === 'cancelado' && (
                      <AccionBtn
                        label="Restaurar"
                        variant="muted"
                        disabled={enProgreso}
                        onClick={() => ejecutarAccion(
                          s.id,
                          () => actionRestaurarListaEspera(s.id),
                          'en_espera'
                        )}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
