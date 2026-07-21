'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { CitaCalendario } from '@/types'
import { useCitasRealtime } from '@/hooks/useCitasRealtime'
import { VistaDia } from './VistaDia'
import { VistaSemana } from './VistaSemana'
import { VistaMes } from './VistaMes'
import { ModalNuevaCita } from './ModalNuevaCita'

// ============================================================
// CalendarioShell.tsx — Fase 18
// Contenedor principal del calendario. Maneja el estado de
// vista y las actualizaciones Realtime.
// ============================================================

type Vista = 'dia' | 'semana' | 'mes'

interface Props {
  citasIniciales: CitaCalendario[]
  fechaInicial: string
}

export function CalendarioShell({ citasIniciales, fechaInicial }: Props) {
  const router = useRouter()
  const [vista, setVista] = useState<Vista>('semana')
  const [fechaActual, setFechaActual] = useState(fechaInicial)
  const [citas, setCitas] = useState<CitaCalendario[]>(citasIniciales)
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ fecha: string; hora: string } | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  // ── Realtime: aplicar cambios sin recargar ─────────────────
  useCitasRealtime(useCallback((citaCambio, eventType) => {
    setCitas((prev) => {
      if (eventType === 'DELETE') {
        return prev.filter((c) => c.id !== citaCambio.id)
      }
      if (eventType === 'INSERT') {
        const nueva = citaCambio as CitaCalendario
        if (prev.find((c) => c.id === nueva.id)) return prev
        return [...prev, nueva].sort((a, b) =>
          a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio)
        )
      }
      // UPDATE
      return prev.map((c) =>
        c.id === citaCambio.id ? { ...c, ...(citaCambio as Partial<CitaCalendario>) } : c
      )
    })
  }, []))

  function abrirModal(fecha?: string, hora?: string) {
    setSlotSeleccionado(fecha ? { fecha, hora: hora ?? '08:00' } : null)
    setModalAbierto(true)
  }

  function onCitaCreada() {
    setModalAbierto(false)
    router.refresh()
  }

  function navegar(delta: number) {
    const d = new Date(fechaActual)
    if (vista === 'dia') d.setDate(d.getDate() + delta)
    else if (vista === 'semana') d.setDate(d.getDate() + delta * 7)
    else d.setMonth(d.getMonth() + delta)
    setFechaActual(d.toISOString().slice(0, 10))
  }

  const labelFecha = new Date(fechaActual + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: vista === 'dia' ? 'long' : undefined,
    month: 'long',
    year: 'numeric',
    day: vista === 'dia' ? 'numeric' : undefined,
  })

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl px-4 py-3">
        {/* Navegacion */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navegar(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={() => setFechaActual(new Date().toISOString().slice(0, 10))}
            className="px-3 h-8 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
          >
            Hoy
          </button>

          <button
            onClick={() => navegar(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <span className="text-sm font-medium text-foreground capitalize ml-1">{labelFecha}</span>
        </div>

        {/* Selector de vista + boton nueva cita */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {(['dia', 'semana', 'mes'] as Vista[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  vista === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {v === 'dia' ? 'Dia' : v === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva cita
          </button>
        </div>
      </div>

      {/* ── Leyenda de estados ──────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        {[
          { color: 'bg-amber-400', label: 'Pendiente' },
          { color: 'bg-green-500', label: 'Confirmada' },
          { color: 'bg-blue-500', label: 'Completada' },
          { color: 'bg-red-400', label: 'Cancelada' },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Vista ───────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {vista === 'dia' && (
          <VistaDia
            fecha={fechaActual}
            citas={citas.filter((c) => c.fecha === fechaActual)}
            onSlotClick={(hora) => abrirModal(fechaActual, hora)}
          />
        )}
        {vista === 'semana' && (
          <VistaSemana
            fechaRef={fechaActual}
            citas={citas}
            onSlotClick={abrirModal}
          />
        )}
        {vista === 'mes' && (
          <VistaMes
            fechaRef={fechaActual}
            citas={citas}
            onDiaClick={(fecha) => { setFechaActual(fecha); setVista('dia') }}
          />
        )}
      </div>

      {/* ── Modal nueva cita ─────────────────────────────────── */}
      {modalAbierto && (
        <ModalNuevaCita
          slotInicial={slotSeleccionado}
          onCreada={onCitaCreada}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}