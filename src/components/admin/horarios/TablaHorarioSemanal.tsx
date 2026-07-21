'use client'

import { useState } from 'react'
import type { HorarioTrabajo, BloqueHorario } from '@/types'
import { actualizarHorario, crearBloqueHorario } from '@/services/horarios'
import { Input } from '@/components/ui/input'

// ============================================================
// TablaHorarioSemanal — rediseño
// Edición del horario regular por día de la semana (los 7 días,
// incluido domingo), con soporte de jornada partida (bloque de
// "mañana" y uno de "tarde" por día).
//
// Cambios respecto a la versión anterior (feedback del negocio):
//  - Layout en tarjetas por día en vez de fila de tabla apretada:
//    más fácil de leer y de tocar en pantallas pequeñas.
//  - El interruptor de "Mañana"/"Tarde" ahora es un switch grande
//    con estado claro (antes era una píldora tenue que parecía
//    deshabilitada, sobre todo en domingo).
//  - Guardado automático al salir del campo de hora (blur), con
//    un indicador de "Guardado"/"Error" visible — antes, si la
//    actualización fallaba (ej. hora fin ≤ hora inicio), no había
//    ningún aviso y parecía que la app "no dejaba poner nada".
//  - Se valida en el cliente que la hora de fin sea posterior a
//    la de inicio antes de guardar, con el mensaje de error junto
//    al bloque en cuestión.
//  - Los 7 días (incluido domingo) se muestran con el mismo peso
//    visual; un día sin bloques activos simplemente se marca como
//    "Cerrado", sin verse "bloqueado" o distinto a los demás.
// ============================================================

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const DEFAULT_HORAS: Record<BloqueHorario, { inicio: string; fin: string }> = {
  manana: { inicio: '08:00', fin: '13:00' },
  tarde: { inicio: '14:00', fin: '18:00' },
}

interface Props {
  horarios: HorarioTrabajo[]
  onActualizado: () => void
}

interface FilaEditable {
  id: string | null // null = el bloque aún no existe en la base de datos
  dia_semana: number
  bloque: BloqueHorario
  hora_inicio: string
  hora_fin: string
  activo: boolean
  guardando: boolean
  error: string | null
  guardadoOk: boolean
}

type MapaDia = Record<number, Record<BloqueHorario, FilaEditable>>

function construirMapaInicial(horarios: HorarioTrabajo[]): MapaDia {
  const mapa = {} as MapaDia

  for (let dia = 0; dia <= 6; dia++) {
    mapa[dia] = {
      manana: {
        id: null,
        dia_semana: dia,
        bloque: 'manana',
        hora_inicio: DEFAULT_HORAS.manana.inicio,
        hora_fin: DEFAULT_HORAS.manana.fin,
        activo: false,
        guardando: false,
        error: null,
        guardadoOk: false,
      },
      tarde: {
        id: null,
        dia_semana: dia,
        bloque: 'tarde',
        hora_inicio: DEFAULT_HORAS.tarde.inicio,
        hora_fin: DEFAULT_HORAS.tarde.fin,
        activo: false,
        guardando: false,
        error: null,
        guardadoOk: false,
      },
    }
  }

  for (const h of horarios) {
    mapa[h.dia_semana][h.bloque] = {
      id: h.id,
      dia_semana: h.dia_semana,
      bloque: h.bloque,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      activo: h.activo,
      guardando: false,
      error: null,
      guardadoOk: false,
    }
  }

  return mapa
}

export function TablaHorarioSemanal({ horarios, onActualizado }: Props) {
  const [mapa, setMapa] = useState<MapaDia>(() => construirMapaInicial(horarios))

  const patchFila = (dia: number, bloque: BloqueHorario, patch: Partial<FilaEditable>) => {
    setMapa((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [bloque]: { ...prev[dia][bloque], ...patch } },
    }))
  }

  const cambiarCampo = (
    dia: number,
    bloque: BloqueHorario,
    campo: 'hora_inicio' | 'hora_fin',
    valor: string,
  ) => {
    patchFila(dia, bloque, { [campo]: valor, error: null, guardadoOk: false })
  }

  const toggleActivo = async (dia: number, bloque: BloqueHorario) => {
    const fila = mapa[dia][bloque]
    patchFila(dia, bloque, { guardando: true, error: null, guardadoOk: false })

    if (fila.id) {
      // El bloque ya existe: solo se actualiza el estado activo.
      const actualizado = await actualizarHorario(fila.id, { activo: !fila.activo })
      if (!actualizado) {
        patchFila(dia, bloque, { guardando: false, error: 'No se pudo guardar. Intenta de nuevo.' })
        return
      }
      patchFila(dia, bloque, { activo: !fila.activo, guardando: false, guardadoOk: true })
    } else {
      // El bloque no existía todavía (ej. primera vez que se activa
      // la tarde de un día, o cualquier bloque de un domingo cerrado).
      const creado = await crearBloqueHorario({
        dia_semana: dia,
        bloque,
        hora_inicio: fila.hora_inicio,
        hora_fin: fila.hora_fin,
      })
      if (!creado) {
        patchFila(dia, bloque, { guardando: false, error: 'No se pudo activar este bloque. Verifica que la hora de fin sea posterior a la de inicio.' })
        return
      }
      patchFila(dia, bloque, {
        id: creado.id,
        hora_inicio: creado.hora_inicio,
        hora_fin: creado.hora_fin,
        activo: creado.activo,
        guardando: false,
        guardadoOk: true,
      })
    }

    onActualizado()
  }

  const guardarFila = async (dia: number, bloque: BloqueHorario) => {
    const fila = mapa[dia][bloque]

    if (fila.hora_fin <= fila.hora_inicio) {
      patchFila(dia, bloque, { error: 'La hora de fin debe ser posterior a la hora de inicio.', guardadoOk: false })
      return
    }

    if (!fila.id) {
      // Aún no existe en la base de datos: activar lo crea con las
      // horas actuales del formulario.
      await toggleActivo(dia, bloque)
      return
    }

    patchFila(dia, bloque, { guardando: true, error: null, guardadoOk: false })
    const actualizado = await actualizarHorario(fila.id, {
      hora_inicio: fila.hora_inicio,
      hora_fin: fila.hora_fin,
    })
    if (!actualizado) {
      patchFila(dia, bloque, { guardando: false, error: 'No se pudo guardar. Intenta de nuevo.' })
      return
    }
    patchFila(dia, bloque, { guardando: false, guardadoOk: true })
    onActualizado()
  }

  const renderBloque = (dia: number, bloque: BloqueHorario, etiqueta: string) => {
    const fila = mapa[dia][bloque]

    return (
      <div className="flex flex-col gap-2 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Switch grande y claro — antes era una píldora tenue */}
          <button
            type="button"
            role="switch"
            aria-checked={fila.activo}
            onClick={() => toggleActivo(dia, bloque)}
            disabled={fila.guardando}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
              fila.activo ? 'bg-primary' : 'bg-muted border border-border'
            }`}
          >
            <span
              className={`inline-block transform rounded-full bg-white shadow transition-transform ${
                fila.activo ? 'translate-x-6' : 'translate-x-1'
              }`}
              style={{ height: '1.125rem', width: '1.125rem' }}
            />
          </button>

          <span className={`w-16 shrink-0 text-sm font-medium ${fila.activo ? 'text-foreground' : 'text-muted-foreground'}`}>
            {etiqueta}
          </span>

          <Input
            type="time"
            value={fila.hora_inicio}
            onChange={(e) => cambiarCampo(dia, bloque, 'hora_inicio', e.target.value)}
            onBlur={() => fila.activo && guardarFila(dia, bloque)}
            disabled={!fila.activo || fila.guardando}
            className="w-28"
            aria-label={`Hora de inicio ${etiqueta.toLowerCase()}`}
          />
          <span className="text-muted-foreground text-xs">a</span>
          <Input
            type="time"
            value={fila.hora_fin}
            onChange={(e) => cambiarCampo(dia, bloque, 'hora_fin', e.target.value)}
            onBlur={() => fila.activo && guardarFila(dia, bloque)}
            disabled={!fila.activo || fila.guardando}
            className="w-28"
            aria-label={`Hora de fin ${etiqueta.toLowerCase()}`}
          />

          {fila.guardando && (
            <svg className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          {!fila.guardando && fila.guardadoOk && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Guardado
            </span>
          )}
        </div>
        {fila.error && (
          <p className="ml-14 text-xs text-destructive">{fila.error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-border bg-card px-5 py-3 text-xs text-muted-foreground">
        Activa mañana y/o tarde por día. Si trabajas jornada partida (ej. 8:00 a 13:00 y 2:00 a 6:00), activa
        ambos bloques con sus propios horarios. Los cambios de hora se guardan automáticamente al salir del campo.
      </p>

      {/* Grid de tarjetas por día.
          Mobile (< md): 1 columna — diseño actual, sin cambios.
          Tablet (md):   2 columnas.
          Desktop (lg+): 3 columnas, aprovechando el ancho disponible. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {Array.from({ length: 7 }, (_, dia) => {
          const cerrado = !mapa[dia].manana.activo && !mapa[dia].tarde.activo
          return (
            <div key={dia} className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-foreground">{DIAS[dia]}</span>
                {cerrado && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Cerrado
                  </span>
                )}
              </div>
              <div className="divide-y divide-border/60">
                {renderBloque(dia, 'manana', 'Mañana')}
                {renderBloque(dia, 'tarde', 'Tarde')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}