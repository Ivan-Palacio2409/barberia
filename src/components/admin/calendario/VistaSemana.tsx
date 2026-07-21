'use client'

import type { CitaCalendario } from '@/types'
import { CitaBloque } from './CitaBloque'

// ============================================================
// VistaSemana.tsx — Fase 18
// Vista semanal: 7 columnas (lun–dom) con grilla de horas.
// ============================================================

const HORA_INICIO = 7
const HORA_FIN = 21
const SLOT_H = 56
const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

function inicioSemana(fechaRef: string): Date {
  const d = new Date(fechaRef + 'T12:00:00')
  const day = d.getDay() // 0 = domingo
  const lunes = new Date(d)
  lunes.setDate(d.getDate() - ((day + 6) % 7))
  return lunes
}

function diasSemana(fechaRef: string): string[] {
  const lunes = inicioSemana(fechaRef)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

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
  return Math.max(horaEnPx(fin) - horaEnPx(inicio), 20)
}

interface Props {
  fechaRef: string
  citas: CitaCalendario[]
  onSlotClick: (fecha: string, hora: string) => void
}

export function VistaSemana({ fechaRef, citas, onSlotClick }: Props) {
  const dias = diasSemana(fechaRef)
  const totalH = (HORA_FIN - HORA_INICIO + 1) * SLOT_H
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div className="overflow-x-auto">
      {/* Cabecera dias */}
      <div className="flex border-b border-border bg-muted/30">
        <div className="w-14 shrink-0" />
        {dias.map((fecha) => {
          const d = new Date(fecha + 'T12:00:00')
          const esHoy = fecha === hoy
          return (
            <div key={fecha} className="flex-1 min-w-[90px] text-center py-2">
              <p className="text-[10px] text-muted-foreground uppercase">
                {DIAS_ES[d.getDay()]}
              </p>
              <p className={`text-sm font-medium mt-0.5 ${esHoy ? 'text-primary' : 'text-foreground'}`}>
                {d.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Grilla */}
      <div className="flex overflow-y-auto max-h-[65vh]">
        {/* Horas */}
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

        {/* Columnas por dia */}
        {dias.map((fecha) => {
          const citasDia = citas.filter((c) => c.fecha === fecha)
          return (
            <div key={fecha} className="flex-1 min-w-[90px] border-r border-border/50 relative" style={{ height: totalH }}>
              {/* Lineas hora */}
              {horas().map((h) => (
                <div key={h} style={{ top: horaEnPx(h) }} className="absolute inset-x-0 border-t border-border/40" />
              ))}

              {/* Slots */}
              {horas().map((h) => (
                <button
                  key={h}
                  style={{ top: horaEnPx(h), height: SLOT_H }}
                  className="absolute inset-x-0 hover:bg-primary/5 transition-colors"
                  onClick={() => onSlotClick(fecha, h)}
                  aria-label={`Nueva cita ${fecha} ${h}`}
                />
              ))}

              {/* Citas */}
              {citasDia.map((cita) => (
                <div
                  key={cita.id}
                  style={{
                    top: horaEnPx(cita.hora_inicio),
                    height: duracionEnPx(cita.hora_inicio, cita.hora_fin),
                    left: 2,
                    right: 2,
                  }}
                  className="absolute z-10"
                >
                  <CitaBloque cita={cita} compact />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
