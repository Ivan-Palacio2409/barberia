'use client'

import { useEffect, useState } from 'react'
import { useReserva } from '@/hooks/useReserva'
import { ReservaStepper } from './ReservaStepper'
import { ReservaResumen } from './ReservaResumen'
import { ReservaStep1Servicios } from './ReservaStep1Servicios'
import { ReservaStep2Fecha } from './ReservaStep2Fecha'
import { ReservaStep3Horario } from './ReservaStep3Horario'
import { ReservaStep4DatosCliente } from './ReservaStep4DatosCliente'
import { ReservaStep5Fotos } from './ReservaStep5Fotos'
import { ReservaStep6Confirmacion } from './ReservaStep6Confirmacion'
import type { CategoriaServicio, Servicio } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────
interface CategoriaConServicios extends CategoriaServicio {
  servicios: Servicio[]
}

interface Props {
  categorias?: CategoriaConServicios[]
  fechasDisponibles?: string[]
}

// ── Shell principal ───────────────────────────────────────────
export function ReservaShell({ categorias = [], fechasDisponibles = [] }: Props) {
  const { paso, setPaso, duracionTotal } = useReserva()

  const [cats] = useState<CategoriaConServicios[]>(categorias)
  const [fechas, setFechas] = useState<string[]>(fechasDisponibles)
  const [loadingFechas, setLoadingFechas] = useState(false)

  const duracion = duracionTotal()

  // Re-fetchar fechas cuando cambia duración y el usuario está en paso 2+
  useEffect(() => {
    if (duracion === 0) { setFechas([]); return }
    if (paso < 2) return

    setLoadingFechas(true)
    fetch(`/api/disponibilidad?duracion=${duracion}`)
      .then((r) => r.json())
      .then((data: string[]) => setFechas(data))
      .catch(() => setFechas([]))
      .finally(() => setLoadingFechas(false))
  }, [duracion, paso])

  const irA = (p: number) => setPaso(p)

  return (
    <div className="min-h-screen pt-24 pb-20 lg:pt-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mb-8 max-w-3xl mx-auto">
          <ReservaStepper pasoActual={paso} />
        </div>

        {/* Layout: contenido + resumen lateral en desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* Panel principal */}
          <div
            className="rounded-2xl border p-5 sm:p-8"
            style={{
              borderColor: 'var(--pub-border-strong)',
              background: 'linear-gradient(135deg, var(--pub-surface) 0%, var(--pub-bg-soft) 100%)',
            }}
          >
            {paso === 1 && (
              <ReservaStep1Servicios
                categorias={cats}
                onNext={() => irA(2)}
              />
            )}

            {paso === 2 && (
              <ReservaStep2Fecha
                fechasDisponibles={loadingFechas ? [] : fechas}
                onNext={() => irA(3)}
                onBack={() => irA(1)}
              />
            )}

            {/* Fase 11 — Paso 3: Horario */}
            {paso === 3 && (
              <ReservaStep3Horario
                onNext={() => irA(4)}
                onBack={() => irA(2)}
              />
            )}

            {/* Fase 11 — Paso 4: Datos del cliente + consentimiento [C2, C8] */}
            {paso === 4 && (
              <ReservaStep4DatosCliente
                onNext={() => irA(5)}
                onBack={() => irA(3)}
              />
            )}

            {/* Fase 12 — Paso 5: Fotos de referencia [C8] */}
            {paso === 5 && (
              <ReservaStep5Fotos
                onNext={() => irA(6)}
                onBack={() => irA(4)}
              />
            )}

            {/* Fase 12 — Paso 6: Confirmación + creación de cita */}
            {paso === 6 && (
              <ReservaStep6Confirmacion
                onBack={() => irA(5)}
              />
            )}
          </div>

          {/* Resumen lateral */}
          <div className="lg:sticky lg:top-28">
            <ReservaResumen />
          </div>
        </div>
      </div>
    </div>
  )
}