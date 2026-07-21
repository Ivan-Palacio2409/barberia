'use client'

import { useState } from 'react'
import type { Cliente } from '@/types'
import { inscribirseListaEspera } from '@/services/lista-espera'

interface FormularioAutenticadoProps {
  cliente: Cliente
  serviciosOpciones: string[]
  onExito: () => void
}

function fechaMinima(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function fechaMaxima(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().split('T')[0]
}

export function FormularioAutenticado({ cliente, serviciosOpciones, onExito }: FormularioAutenticadoProps) {
  const [fecha, setFecha] = useState('')
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleServicio(s: string) {
    setServiciosSeleccionados((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fecha) {
      setError('Selecciona una fecha.')
      return
    }

    setEnviando(true)

    try {
      await inscribirseListaEspera({
        cliente_id: cliente.id,
        fecha_solicitada: fecha,
        servicios_deseados: serviciosSeleccionados.join(', ') || undefined,
      })
      onExito()
    } catch {
      setError('No se pudo registrar la solicitud. Intenta de nuevo.')
      setEnviando(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--pub-gold)]/40 bg-[var(--pub-bg)] px-3 py-2.5 text-sm text-[var(--pub-text)] focus:outline-none focus:ring-2 focus:ring-[var(--pub-gold)] transition'

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Datos precargados */}
      <div className="bg-[var(--pub-bg)] rounded-lg px-4 py-3 flex items-center gap-3 border border-[var(--pub-gold)]/20">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--pub-on-gold)] text-sm font-semibold flex-shrink-0"
          style={{ background: 'var(--pub-gold)' }}
          aria-hidden="true"
        >
          {cliente.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--pub-text)]">{cliente.nombre}</p>
          <p className="text-xs text-[var(--pub-text-muted)]">{cliente.telefono}</p>
        </div>
      </div>

      {/* Fecha */}
      <div className="flex flex-col gap-1">
        <label htmlFor="fecha-espera-auth" className="text-sm font-medium text-[var(--pub-text)]">
          Fecha deseada <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="fecha-espera-auth"
          type="date"
          required
          min={fechaMinima()}
          max={fechaMaxima()}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Servicios */}
      {serviciosOpciones.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-[var(--pub-text)] mb-1">
            Servicios de interés{' '}
            <span className="text-[var(--pub-text-muted)] font-normal">(opcional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {serviciosOpciones.map((s) => {
              const activo = serviciosSeleccionados.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServicio(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                  style={{
                    background: activo ? 'var(--pub-gold)' : 'transparent',
                    borderColor: 'var(--pub-gold)',
                    color: activo ? 'var(--pub-on-gold)' : 'var(--pub-gold)',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || !fecha}
        className="w-full py-3 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity disabled:opacity-50"
        style={{ background: 'var(--pub-gold)' }}
      >
        {enviando ? 'Enviando solicitud...' : 'Unirme a la lista de espera'}
      </button>
    </form>
  )
}
