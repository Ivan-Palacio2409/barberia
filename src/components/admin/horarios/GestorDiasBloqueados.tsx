'use client'

import { useMemo, useState } from 'react'
import type { DiaBloqueado } from '@/types'
import { bloquearFecha, desbloquearFecha } from '@/services/horarios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ============================================================
// GestorDiasBloqueados — rediseño
// Antes era un formulario con un <input type="date"> + botón
// "Bloquear fecha" y, debajo, una lista plana de fechas. El
// pedido del negocio fue reemplazarlo por un calendario: el
// admin ve el mes completo y hace clic directamente sobre el
// día que va a trabajar o no.
//
//  - Día normal (blanco/verde) = día en el que se trabaja.
//  - Día bloqueado (rojo)      = día libre / festivo / vacaciones.
//  - Clic en un día normal   → lo bloquea (con motivo opcional).
//  - Clic en un día bloqueado → lo reabre (lo quita de la lista).
//  - Los días pasados no se pueden modificar.
//
// La tabla y los servicios (bloquearFecha/desbloquearFecha) no
// cambiaron: solo cambió la forma de interactuar con ellos.
// ============================================================

interface Props {
  dias: DiaBloqueado[]
  onActualizado: () => void
}

const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toISODate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function GestorDiasBloqueados({ dias, onActualizado }: Props) {
  const hoy = new Date().toISOString().split('T')[0]
  const hoyDate = new Date()

  const [mesRef, setMesRef] = useState(() => new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1))
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const mapaBloqueados = useMemo(() => {
    const m = new Map<string, DiaBloqueado>()
    dias.forEach((d) => m.set(d.fecha, d))
    return m
  }, [dias])

  const diaSeleccionadoInfo = fechaSeleccionada ? mapaBloqueados.get(fechaSeleccionada) ?? null : null

  const celdas = useMemo(() => {
    const anio = mesRef.getFullYear()
    const mes = mesRef.getMonth()
    const primerDiaSemana = new Date(anio, mes, 1).getDay()
    const totalDias = new Date(anio, mes + 1, 0).getDate()

    const lista: { fecha: string | null; dia: number | null }[] = []
    for (let i = 0; i < primerDiaSemana; i++) lista.push({ fecha: null, dia: null })
    for (let d = 1; d <= totalDias; d++) lista.push({ fecha: toISODate(anio, mes, d), dia: d })
    return lista
  }, [mesRef])

  function cambiarMes(delta: number) {
    setMesRef((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  function seleccionarDia(fecha: string) {
    setError('')
    setFechaSeleccionada(fecha)
    setMotivo(mapaBloqueados.get(fecha)?.motivo ?? '')
  }

  async function confirmarBloqueo() {
    if (!fechaSeleccionada) return
    setGuardando(true)
    setError('')
    const resultado = await bloquearFecha(fechaSeleccionada, motivo || undefined)
    setGuardando(false)
    if (resultado) {
      setFechaSeleccionada(null)
      setMotivo('')
      onActualizado()
    } else {
      setError('No se pudo bloquear la fecha. Puede que ya esté bloqueada.')
    }
  }

  async function confirmarDesbloqueo() {
    if (!diaSeleccionadoInfo) return
    setGuardando(true)
    setError('')
    const ok = await desbloquearFecha(diaSeleccionadoInfo.id)
    setGuardando(false)
    if (ok) {
      setFechaSeleccionada(null)
      setMotivo('')
      onActualizado()
    } else {
      setError('No se pudo reabrir el día. Intenta de nuevo.')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* Calendario */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => cambiarMes(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Mes anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm font-medium text-foreground">
            {MESES[mesRef.getMonth()]} de {mesRef.getFullYear()}
          </span>
          <button
            onClick={() => cambiarMes(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Mes siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {DIAS_SEMANA.map((d, i) => <div key={i} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((c, i) => {
            if (!c.fecha) return <div key={i} />

            const bloqueado = mapaBloqueados.has(c.fecha)
            const pasado = c.fecha < hoy
            const esHoy = c.fecha === hoy
            const seleccionado = c.fecha === fechaSeleccionada

            return (
              <button
                key={c.fecha}
                type="button"
                disabled={pasado}
                onClick={() => seleccionarDia(c.fecha as string)}
                className={[
                  'aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center relative',
                  pasado
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : bloqueado
                      ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                      : 'text-foreground hover:bg-muted',
                  seleccionado ? 'ring-2 ring-primary' : '',
                  esHoy && !seleccionado ? 'ring-1 ring-primary/50' : '',
                ].join(' ')}
              >
                {c.dia}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-destructive/25" /> Día libre / festivo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-border" /> Día de trabajo
          </span>
        </div>
      </div>

      {/* Panel del día seleccionado */}
      <div className="rounded-xl border border-border bg-card p-4 h-fit">
        {!fechaSeleccionada ? (
          <p className="text-sm text-muted-foreground">
            Selecciona un día en el calendario para bloquearlo (marcarlo como no laborado) o, si ya está
            bloqueado, para reabrirlo.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {(() => {
                const [y, m, d] = fechaSeleccionada.split('-')
                return `${d}/${m}/${y}`
              })()}
            </p>

            {diaSeleccionadoInfo ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Este día está marcado como libre / festivo.
                  {diaSeleccionadoInfo.motivo && <> Motivo: <span className="text-foreground">{diaSeleccionadoInfo.motivo}</span></>}
                </p>
                <Button onClick={confirmarDesbloqueo} disabled={guardando} variant="outline" className="w-full">
                  {guardando ? 'Reabriendo...' : 'Reabrir este día'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
                  <Input
                    type="text"
                    placeholder="Ej. Festivo, vacaciones..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
                <Button onClick={confirmarBloqueo} disabled={guardando} className="w-full">
                  {guardando ? 'Bloqueando...' : 'Bloquear este día'}
                </Button>
              </>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="button"
              onClick={() => { setFechaSeleccionada(null); setMotivo(''); setError('') }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar selección
            </button>
          </div>
        )}
      </div>
    </div>
  )
}