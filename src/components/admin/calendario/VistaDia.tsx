'use client'

import type { CitaCalendario } from '@/types'
import { CitaBloque } from './CitaBloque'

// ============================================================
// VistaDia.tsx — Fase 18
// Vista diaria: grilla de horas 07:00–21:00.
// ============================================================

const HORA_INICIO = 7
const HORA_FIN = 21
const SLOT_H = 60 // px por hora

function horas(): string[] {
  const arr: string[] = []
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
    arr.push(`${String(h).padStart(2, '0')}:00`)
  }
  return arr
}

function horaEnPx(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return (h - HORA_INICIO) * SLOT_H + (m / 60) * SLOT_H
}

function duracionEnPx(inicio: string, fin: string): number {
  return Math.max(horaEnPx(fin) - horaEnPx(inicio), 24)
}

interface Props {
  fecha: string
  citas: CitaCalendario[]
  onSlotClick: (hora: string) => void
}

export function VistaDia({ citas, onSlotClick }: Props) {
  const totalH = (HORA_FIN - HORA_INICIO + 1) * SLOT_H

  return (
    <div className="flex overflow-y-auto max-h-[70vh]">
      {/* Columna horas */}
      <div className="w-14 shrink-0 border-r border-border">
        <div style={{ height: totalH }} className="relative">
          {horas().map((h) => (
            <div
              key={h}
              style={{ top: horaEnPx(h) }}
              className="absolute right-2 text-[10px] text-muted-foreground -translate-y-2"
            >
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* Columna citas */}
      <div className="flex-1 relative" style={{ height: totalH }}>
        {/* Lineas de hora */}
        {horas().map((h) => (
          <div
            key={h}
            style={{ top: horaEnPx(h) }}
            className="absolute inset-x-0 border-t border-border/50"
          />
        ))}

        {/* Slots clickeables */}
        {horas().map((h) => (
          <button
            key={h}
            style={{ top: horaEnPx(h), height: SLOT_H }}
            className="absolute inset-x-0 hover:bg-primary/5 transition-colors"
            onClick={() => onSlotClick(h)}
            aria-label={`Nueva cita a las ${h}`}
          />
        ))}

        {/* Citas */}
        {citas.map((cita) => {
          const top = horaEnPx(cita.hora_inicio)
          const height = duracionEnPx(cita.hora_inicio, cita.hora_fin)
          return (
            <div
              key={cita.id}
              style={{ top, height, left: 4, right: 4 }}
              className="absolute z-10"
            >
              <CitaBloque cita={cita} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
