'use client'

import { useState } from 'react'
import type { HorarioEspecial } from '@/types'
import {
  crearHorarioEspecial,
  eliminarHorarioEspecial,
} from '@/services/horarios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ============================================================
// GestorHorariosEspeciales — Fase 21
// Permite definir un horario diferente para una fecha puntual.
// Tiene precedencia sobre el horario semanal regular.
// ============================================================

interface Props {
  horariosEspeciales: HorarioEspecial[]
  onActualizado: () => void
}

const HORA_DEFAULT_INICIO = '08:00'
const HORA_DEFAULT_FIN    = '18:00'

export function GestorHorariosEspeciales({ horariosEspeciales, onActualizado }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  const [fecha,       setFecha]       = useState('')
  const [horaInicio,  setHoraInicio]  = useState(HORA_DEFAULT_INICIO)
  const [horaFin,     setHoraFin]     = useState(HORA_DEFAULT_FIN)
  const [motivo,      setMotivo]      = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState('')

  const agregar = async () => {
    if (!fecha)                          { setError('Selecciona una fecha'); return }
    if (horaFin <= horaInicio)           { setError('La hora de cierre debe ser posterior a la de apertura'); return }
    setError('')
    setGuardando(true)
    const resultado = await crearHorarioEspecial({
      fecha,
      hora_inicio: horaInicio,
      hora_fin:    horaFin,
      motivo:      motivo || undefined,
    })
    setGuardando(false)
    if (resultado) {
      setFecha('')
      setHoraInicio(HORA_DEFAULT_INICIO)
      setHoraFin(HORA_DEFAULT_FIN)
      setMotivo('')
      onActualizado()
    } else {
      setError('No se pudo guardar. Puede que ya exista un horario especial para esa fecha.')
    }
  }

  const eliminar = async (id: string) => {
    await eliminarHorarioEspecial(id)
    onActualizado()
  }

  return (
    <div className="space-y-4">
      {/* Formulario */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground mb-3">Agregar horario especial</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fecha</label>
            <Input type="date" value={fecha} min={hoy} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Apertura</label>
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cierre</label>
            <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-4">
            <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
            <Input
              type="text"
              placeholder="Ej. Horario navideño, evento especial..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-3 flex justify-end">
          <Button onClick={agregar} disabled={guardando}>
            {guardando ? (
              <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            Guardar horario especial
          </Button>
        </div>
      </div>

      {/* Lista */}
      {horariosEspeciales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          No hay horarios especiales configurados
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Apertura</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Cierre</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Motivo</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {horariosEspeciales.map((he) => {
                const [y, m, d] = he.fecha.split('-')
                const label = `${d}/${m}/${y}`
                const pasada = he.fecha < hoy
                return (
                  <tr key={he.id} className={pasada ? 'opacity-40' : ''}>
                    <td className="px-5 py-3 font-medium text-foreground tabular-nums">{label}</td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">{he.hora_inicio.slice(0, 5)}</td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">{he.hora_fin.slice(0, 5)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{he.motivo || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => eliminar(he.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                        title="Eliminar horario especial"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
