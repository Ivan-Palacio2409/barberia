'use client'

import { useRouter } from 'next/navigation'
import type { CitaCalendario, EstadoCita } from '@/types'

// ============================================================
// CitaBloque.tsx — Fase 18
// Bloque de color que representa una cita en las vistas.
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
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/admin/citas/${cita.id}`)}
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
  )
}
