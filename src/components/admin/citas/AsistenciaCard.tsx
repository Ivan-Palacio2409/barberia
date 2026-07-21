'use client'

import { useState, useTransition } from 'react'
import { marcarAsistencia } from '@/services/citas'
import type { Cita } from '@/types'

// ============================================================
// AsistenciaCard — panel admin (dentro de DetalleCitaShell)
// Cuando ya pasó la hora estimada de fin de la cita y todavía no
// se registró asistencia, muestra botones para que el admin
// confirme si el cliente asistió o no. Si asistió, se dispara de
// inmediato la solicitud de reseña (email + WhatsApp al cliente).
// ============================================================

interface Props {
  cita: Cita
  onUpdated: () => void
}

function yaTermino(cita: Cita): boolean {
  const finMs = new Date(`${cita.fecha}T${cita.hora_fin}`).getTime()
  return finMs < Date.now()
}

export function AsistenciaCard({ cita, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Solo aplica a citas que no fueron canceladas y ya pasaron su hora de fin.
  const aplica = cita.estado !== 'cancelada' && yaTermino(cita)
  const yaConfirmada = cita.estado === 'completada' || cita.estado === 'no_asistio'

  const confirmar = (asistio: boolean) => {
    setError('')
    startTransition(async () => {
      const resultado = await marcarAsistencia(cita.id, cita.cliente_id, asistio, 'admin')
      if (!resultado) {
        setError('No se pudo registrar la asistencia. Intenta de nuevo.')
        return
      }
      onUpdated()
    })
  }

  if (!aplica && !yaConfirmada) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">Asistencia</h2>
        <p className="text-sm text-muted-foreground">
          Se podrá confirmar la asistencia cuando termine el horario de la cita.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Asistencia</h2>

      {cita.estado === 'completada' && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            El cliente asistió
          </span>
          {cita.resena_solicitada && (
            <span className="text-xs text-muted-foreground">· Se envió solicitud de reseña</span>
          )}
        </div>
      )}

      {cita.estado === 'no_asistio' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          El cliente no asistió
        </span>
      )}

      {!yaConfirmada && aplica && (
        <>
          <p className="text-sm text-muted-foreground">¿El cliente asistió a esta cita?</p>
          <div className="flex gap-2">
            <button
              disabled={isPending}
              onClick={() => confirmar(true)}
              className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              Sí asistió
            </button>
            <button
              disabled={isPending}
              onClick={() => confirmar(false)}
              className="flex-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-60"
            >
              No asistió
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}
    </div>
  )
}
