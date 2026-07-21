'use client'

import { useState, useRef } from 'react'
import { inscribirInvitadoAction } from '@/app/actions/lista-espera'

interface FormularioInvitadoProps {
  onExito: () => void
  serviciosOpciones: string[]
}

// Fecha mínima: mañana
function fechaMinima(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Fecha máxima: 3 meses adelante
function fechaMaxima(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().split('T')[0]
}

export function FormularioInvitado({ onExito, serviciosOpciones }: FormularioInvitadoProps) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  function toggleServicio(s: string) {
    setServiciosSeleccionados((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    const fd = new FormData(formRef.current!)
    fd.set('servicios_deseados', serviciosSeleccionados.join(', '))

    const result = await inscribirInvitadoAction(fd)

    if (result.ok) {
      onExito()
    } else {
      setError(result.error ?? 'Ocurrió un error. Intenta de nuevo.')
      setEnviando(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[var(--pub-gold)]/40 bg-[var(--pub-bg)] px-3 py-2.5 text-sm text-[var(--pub-text)] placeholder:text-[var(--pub-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pub-gold)] transition'

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre-espera" className="text-sm font-medium text-[var(--pub-text)]">
          Nombre completo <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="nombre-espera"
          name="nombre"
          type="text"
          required
          minLength={2}
          placeholder="Tu nombre"
          className={inputClass}
        />
      </div>

      {/* Teléfono */}
      <div className="flex flex-col gap-1">
        <label htmlFor="telefono-espera" className="text-sm font-medium text-[var(--pub-text)]">
          Teléfono <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="telefono-espera"
          name="telefono"
          type="tel"
          required
          placeholder="3001234567"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email-espera" className="text-sm font-medium text-[var(--pub-text)]">
          Correo electrónico{' '}
          <span className="text-[var(--pub-text-muted)] font-normal">(opcional)</span>
        </label>
        <input
          id="email-espera"
          name="email"
          type="email"
          placeholder="correo@ejemplo.com"
          className={inputClass}
        />
      </div>

      {/* Fecha */}
      <div className="flex flex-col gap-1">
        <label htmlFor="fecha-espera" className="text-sm font-medium text-[var(--pub-text)]">
          Fecha deseada <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="fecha-espera"
          name="fecha_solicitada"
          type="date"
          required
          min={fechaMinima()}
          max={fechaMaxima()}
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

      {/* Error */}
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
        disabled={enviando}
        className="w-full py-3 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity disabled:opacity-50"
        style={{ background: 'var(--pub-gold)' }}
      >
        {enviando ? 'Enviando solicitud...' : 'Unirme a la lista de espera'}
      </button>
    </form>
  )
}
