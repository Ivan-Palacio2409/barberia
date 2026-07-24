'use client'

import { useState } from 'react'
import type { CitaCalendario, EstadoCita } from '@/types'
import { ModalReciboCita } from './ModalReciboCita'

// ============================================================
// CitaBloque.tsx — Fase 18
// Bloque de color que representa una cita en las vistas.
//
// Fix: antes navegaba de una a /admin/citas/[id] al hacer clic.
// Ahora abre un recibo rápido (ModalReciboCita) con los datos que
// el propio calendario ya tiene cargados — sin salir de la vista
// del calendario. Desde el recibo se puede entrar al detalle
// completo si hace falta reagendar o cancelar.
// ============================================================

const ESTADO_BG: Record<EstadoCita, string> = {
  pendiente:  'bg-amber-100 border-amber-400 text-amber-800',
  confirmada: 'bg-green-100 border-green-500 text-green-800',
  completada: 'bg-blue-100 border-blue-500 text-blue-800',
  cancelada:  'bg-red-100 border-red-400 text-red-700',
  no_asistio: 'bg-stone-200 border-stone-400 text-stone-700',
}

interface Props {
  cita: CitaCalendario
  compact?: boolean
}

export function CitaBloque({ cita, compact = false }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className={`w-full text-left rounded border-l-4 px-2 py-1 text-xs leading-tight transition-opacity hover:opacity-80 ${ESTADO_BG[cita.estado]}`}
        title={`${cita.cliente.nombre} — ${cita.hora_inicio.slice(0, 5)}`}
      >
        <span className="font-medium block truncate">
          {cita.hora_inicio.slice(0, 5)} {cita.cliente.nombre}
        </span>
        {!compact && (
          <span className="block truncate opacity-75">
            {cita.servicios.map((s) => s.nombre).join(', ')}
          </span>
        )}
      </button>

      {abierto && (
        <ModalReciboCita cita={cita} onClose={() => setAbierto(false)} />
      )}
    </>
  )
}