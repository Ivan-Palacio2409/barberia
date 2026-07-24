'use client'

import { useState, useTransition } from 'react'
import type { CitaDashboard } from '@/types'
import { actionCompletarCita } from '@/app/actions/admin-citas'

// ============================================================
// CitasHoyWidget.tsx — Fase 17
// Lista de citas del dia con acciones rapidas inline.
// Client Component para acciones sin navegacion.
// ============================================================

const ESTADO_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  'bg-amber-100 text-amber-700',
  confirmada: 'bg-green-100 text-green-700',
  completada: 'bg-blue-100 text-blue-700',
  cancelada:  'bg-red-100 text-red-700',
}

function formatHora(h: string) {
  return h.slice(0, 5)
}

interface Props {
  citas: CitaDashboard[]
}

export function CitasHoyWidget({ citas }: Props) {
  const [estados, setEstados] = useState<Record<string, string>>(
    Object.fromEntries(citas.map((c) => [c.id, c.estado]))
  )
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function handleCompletar(id: string) {
    setErrores((prev) => ({ ...prev, [id]: '' }))
    startTransition(async () => {
      const res = await actionCompletarCita(id)
      if (res.error) {
        setErrores((prev) => ({ ...prev, [id]: res.error! }))
      } else {
        setEstados((prev) => ({ ...prev, [id]: 'completada' }))
      }
    })
  }

  if (citas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No hay citas programadas para hoy.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {citas.map((cita) => {
        const estado = estados[cita.id] ?? cita.estado
        return (
          <li key={cita.id} className="py-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            {/* Hora */}
            <span className="text-sm font-mono text-muted-foreground w-24 shrink-0">
              {formatHora(cita.hora_inicio)} – {formatHora(cita.hora_fin)}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{cita.cliente_nombre}</p>
              <p className="text-xs text-muted-foreground truncate">
                {cita.servicios_nombres.join(', ') || 'Sin servicios'}
              </p>
              {errores[cita.id] && (
                <p className="text-xs text-destructive mt-0.5">{errores[cita.id]}</p>
              )}
            </div>

            {/* Estado + acciones */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[estado] ?? ''}`}>
                {ESTADO_LABEL[estado] ?? estado}
              </span>

              {estado === 'pendiente' || estado === 'confirmada' ? (
                <button
                  onClick={() => handleCompletar(cita.id)}
                  disabled={pending}
                  className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  Completar
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}