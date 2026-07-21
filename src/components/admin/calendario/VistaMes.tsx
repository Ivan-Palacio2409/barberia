'use client'

import type { CitaCalendario } from '@/types'

// ============================================================
// VistaMes.tsx — Fase 18
// Vista mensual: grilla de dias con conteo de citas.
// Click en dia navega a vista diaria.
// ============================================================

const DIAS_ES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

const ESTADO_DOT: Record<string, string> = {
  pendiente:  'bg-amber-400',
  confirmada: 'bg-green-500',
  completada: 'bg-blue-500',
  cancelada:  'bg-red-400',
}

function diasDelMes(fechaRef: string): (string | null)[] {
  const d = new Date(fechaRef + 'T12:00:00')
  const año = d.getFullYear()
  const mes = d.getMonth()

  const primerDia = new Date(año, mes, 1)
  // Ajustar para que lunes = 0
  const offset = (primerDia.getDay() + 6) % 7

  const totalDias = new Date(año, mes + 1, 0).getDate()
  const celdas: (string | null)[] = Array(offset).fill(null)

  for (let i = 1; i <= totalDias; i++) {
    celdas.push(new Date(año, mes, i).toISOString().slice(0, 10))
  }

  // Completar semana final
  while (celdas.length % 7 !== 0) celdas.push(null)
  return celdas
}

interface Props {
  fechaRef: string
  citas: CitaCalendario[]
  onDiaClick: (fecha: string) => void
}

export function VistaMes({ fechaRef, citas, onDiaClick }: Props) {
  const celdas = diasDelMes(fechaRef)
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div>
      {/* Cabecera */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {DIAS_ES.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7">
        {celdas.map((fecha, i) => {
          if (!fecha) {
            return <div key={i} className="border-r border-b border-border/50 min-h-[80px] bg-muted/20" />
          }

          const citasDia = citas.filter((c) => c.fecha === fecha)
          const esHoy = fecha === hoy
          const dia = new Date(fecha + 'T12:00:00').getDate()

          return (
            <button
              key={fecha}
              onClick={() => onDiaClick(fecha)}
              className={`border-r border-b border-border/50 min-h-[80px] p-1.5 text-left hover:bg-primary/5 transition-colors ${
                esHoy ? 'bg-primary/5' : ''
              }`}
            >
              <span className={`text-xs font-medium inline-block w-5 h-5 flex items-center justify-center rounded-full ${
                esHoy ? 'bg-primary text-primary-foreground' : 'text-foreground'
              }`}>
                {dia}
              </span>

              <div className="mt-1 space-y-0.5">
                {citasDia.slice(0, 3).map((cita) => (
                  <div key={cita.id} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ESTADO_DOT[cita.estado]}`} />
                    <span className="text-[10px] text-foreground truncate">
                      {cita.hora_inicio.slice(0, 5)} {cita.cliente.nombre}
                    </span>
                  </div>
                ))}
                {citasDia.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{citasDia.length - 3} mas
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
