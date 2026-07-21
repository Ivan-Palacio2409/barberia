'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Cita, EstadoCita } from '@/types'

// ============================================================
// HistorialCitas.tsx — Fase 19
// Lista del historial de citas de un cliente en su ficha.
// ============================================================

interface Props {
  historial: Cita[]
}

const ESTADO_STYLES: Record<EstadoCita, string> = {
  pendiente:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmada: 'bg-blue-50 text-blue-700 border border-blue-200',
  completada: 'bg-green-50 text-green-700 border border-green-200',
  cancelada:  'bg-red-50 text-red-700 border border-red-200',
  no_asistio: 'bg-stone-100 text-stone-700 border border-stone-300',
}

const ESTADO_LABEL: Record<EstadoCita, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
  no_asistio: 'No asistió',
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatHora(hora: string) {
  return hora.slice(0, 5)
}

export function HistorialCitas({ historial }: Props) {
  if (historial.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        Este cliente no tiene citas registradas.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {historial.map((cita) => {
        const servicios =
          (cita as unknown as { cita_servicios?: { servicio: { nombre: string } }[] })
            .cita_servicios?.map((cs) => cs.servicio.nombre) ?? []

        return (
          <div
            key={cita.id}
            className="bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground capitalize">
                  {formatFecha(cita.fecha)}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ESTADO_STYLES[cita.estado])}>
                  {ESTADO_LABEL[cita.estado]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatHora(cita.hora_inicio)} – {formatHora(cita.hora_fin)}
              </p>
              {servicios.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {servicios.join(', ')}
                </p>
              )}
              {cita.precio_total !== undefined && cita.precio_total > 0 && (
                <p className="text-xs font-medium text-foreground">
                  ${Number(cita.precio_total).toLocaleString('es-CO')} COP
                </p>
              )}
            </div>
            <Link
              href={`/admin/citas/${cita.id}`}
              className="shrink-0 text-xs text-primary hover:underline font-medium"
            >
              Ver detalle
            </Link>
          </div>
        )
      })}
    </div>
  )
}
