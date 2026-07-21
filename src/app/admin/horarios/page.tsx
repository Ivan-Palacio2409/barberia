'use client'

// ============================================================
// /admin/horarios — Fase 21
// Gestión de horarios: semanal regular, días bloqueados y
// horarios especiales por fecha puntual.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import type { DiaBloqueado, HorarioEspecial, HorarioTrabajo } from '@/types'
import {
  getHorariosTrabajo,
  getDiasBloqueados,
  getHorariosEspeciales,
} from '@/services/horarios'
import {
  TablaHorarioSemanal,
  GestorDiasBloqueados,
  GestorHorariosEspeciales,
} from '@/components/admin/horarios'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

type Pestana = 'semanal' | 'bloqueados' | 'especiales'

export default function AdminHorariosPage() {
  const [pestana,            setPestana]            = useState<Pestana>('semanal')
  const [horarios,           setHorarios]           = useState<HorarioTrabajo[]>([])
  const [diasBloqueados,     setDiasBloqueados]     = useState<DiaBloqueado[]>([])
  const [horariosEspeciales, setHorariosEspeciales] = useState<HorarioEspecial[]>([])
  const [loading,            setLoading]            = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [h, d, e] = await Promise.all([
      getHorariosTrabajo(false),
      getDiasBloqueados(),
      getHorariosEspeciales(),
    ])
    setHorarios(h)
    setDiasBloqueados(d)
    setHorariosEspeciales(e)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const pestanas: { id: Pestana; label: string; conteo?: number }[] = [
    { id: 'semanal',    label: 'Horario semanal' },
    { id: 'bloqueados', label: 'Días bloqueados',      conteo: diasBloqueados.filter((d) => d.fecha >= new Date().toISOString().split('T')[0]).length },
    { id: 'especiales', label: 'Horarios especiales',  conteo: horariosEspeciales.filter((h) => h.fecha >= new Date().toISOString().split('T')[0]).length },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Horarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura el horario regular de atención, bloquea fechas y define horarios especiales para días puntuales
        </p>
      </div>

      {/* Pestanas */}
      <div className="flex gap-0 rounded-xl border border-border bg-card overflow-hidden self-start w-fit">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-r border-border last:border-r-0 ${
              pestana === p.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {p.label}
            {p.conteo != null && p.conteo > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                pestana === p.id ? 'bg-card/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {p.conteo}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {pestana === 'semanal' && (
            <TablaHorarioSemanal
              horarios={horarios}
              onActualizado={cargar}
            />
          )}

          {pestana === 'bloqueados' && (
            <GestorDiasBloqueados
              dias={diasBloqueados}
              onActualizado={cargar}
            />
          )}

          {pestana === 'especiales' && (
            <GestorHorariosEspeciales
              horariosEspeciales={horariosEspeciales}
              onActualizado={cargar}
            />
          )}
        </>
      )}
    </div>
  )
}
