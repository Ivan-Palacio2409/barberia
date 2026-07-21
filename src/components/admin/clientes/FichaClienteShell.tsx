'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Cliente, Cita } from '@/types'
import { actualizarCliente } from '@/services/clientes'
import { GaleriaEstilos } from './GaleriaEstilos'
import { HistorialCitas } from './HistorialCitas'

// ============================================================
// FichaClienteShell.tsx — Fase 19
// Ficha completa del cliente en panel admin. Tabs: Info,
// Historial, Galeria de diseños anteriores.
// ============================================================

interface Props {
  cliente: Cliente
  historial: Cita[]
}

type Tab = 'info' | 'historial' | 'galeria'

function calcularFrecuencia(historial: Cita[]) {
  const completadas = historial.filter((c) => c.estado === 'completada')
  const esFrecuente = completadas.length >= 3
  const hoy = new Date()
  const limite60 = new Date(hoy)
  limite60.setDate(hoy.getDate() - 60)
  const ultimaFecha = completadas
    .map((c) => new Date(c.fecha))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const inactivo = !ultimaFecha || ultimaFecha < limite60
  return { total: completadas.length, esFrecuente, inactivo }
}

export function FichaClienteShell({ cliente, historial }: Props) {
  const [tab, setTab] = useState<Tab>('info')
  const [observaciones, setObservaciones] = useState(cliente.observaciones ?? '')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const { total, esFrecuente, inactivo } = calcularFrecuencia(historial)

  // Todas las imágenes de diseños de referencia de todas las citas
  const todasLasImagenes = historial.flatMap((c) =>
    (c.estilos_referencia ?? []).map((d) => ({ ...d, cita: c }))
  )

  async function handleGuardarObservaciones() {
    setGuardando(true)
    await actualizarCliente(cliente.id, { observaciones })
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/clientes" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-display font-semibold text-foreground">{cliente.nombre}</h1>
              {esFrecuente && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Cliente frecuente
                </span>
              )}
              {inactivo && (
                <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Inactivo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} visita{total !== 1 ? 's' : ''} completada{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {([
            { key: 'info', label: 'Informacion' },
            { key: 'historial', label: `Historial (${historial.length})` },
            { key: 'galeria', label: `Galeria (${todasLasImagenes.length})` },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos personales */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Datos personales</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-3">
                <dt className="w-28 text-muted-foreground shrink-0">Telefono</dt>
                <dd className="text-foreground">{cliente.telefono}</dd>
              </div>
              {cliente.email && (
                <div className="flex gap-3">
                  <dt className="w-28 text-muted-foreground shrink-0">Email</dt>
                  <dd className="text-foreground break-all">{cliente.email}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-28 text-muted-foreground shrink-0">Registro</dt>
                <dd className="text-foreground">
                  {new Date(cliente.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </dd>
              </div>
              {cliente.fecha_ultima_visita && (
                <div className="flex gap-3">
                  <dt className="w-28 text-muted-foreground shrink-0">Ultima visita</dt>
                  <dd className="text-foreground">
                    {new Date(cliente.fecha_ultima_visita).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-28 text-muted-foreground shrink-0">Tipo cuenta</dt>
                <dd className="text-foreground">
                  {cliente.auth_user_id ? 'Cuenta registrada' : 'Invitado'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Observaciones */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Observaciones internas</h2>
            <p className="text-xs text-muted-foreground">Visible solo para el equipo. No se comparte con el cliente.</p>
            <textarea
              rows={6}
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value)
                setGuardado(false)
              }}
              placeholder="Preferencias, alergias, notas especiales..."
              className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleGuardarObservaciones}
              disabled={guardando}
              className={cn(
                'text-sm px-4 py-2 rounded-lg font-medium transition-colors',
                guardado
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {guardando ? 'Guardando...' : guardado ? 'Guardado' : 'Guardar observaciones'}
            </button>
          </div>

          {/* Resumen de frecuencia */}
          <div className="bg-card rounded-xl border border-border p-6 md:col-span-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Frecuencia de asistencia</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Citas completadas',
                  value: historial.filter((c) => c.estado === 'completada').length,
                },
                {
                  label: 'Citas pendientes',
                  value: historial.filter((c) => c.estado === 'pendiente').length,
                },
                {
                  label: 'Citas canceladas',
                  value: historial.filter((c) => c.estado === 'cancelada').length,
                },
                {
                  label: 'Estilos subidos',
                  value: todasLasImagenes.length,
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center py-4 px-3 rounded-lg bg-muted/40">
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <HistorialCitas historial={historial} />
      )}

      {tab === 'galeria' && (
        <GaleriaEstilos imagenes={todasLasImagenes} />
      )}
    </div>
  )
}
