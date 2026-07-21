'use client'

import { useState } from 'react'
import { crearSugerencia } from '@/services/sugerencias'

interface SugerenciaFormProps {
  clienteId: string
}

const MIN_MENSAJE = 10
const MAX_MENSAJE = 1000

export function SugerenciaForm({ clienteId }: SugerenciaFormProps) {
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const texto = mensaje.trim()
    if (texto.length < MIN_MENSAJE) {
      setError(`El mensaje debe tener al menos ${MIN_MENSAJE} caracteres.`)
      return
    }

    setEnviando(true)

    try {
      await crearSugerencia(clienteId, texto)
      setExito(true)
      setMensaje('')
    } catch {
      setError('No se pudo enviar la sugerencia. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (exito) {
    return (
      <div className="bg-[var(--pub-surface)] rounded-xl border border-[var(--pub-gold)]/20 p-6 text-center">
        <div className="flex justify-center mb-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--pub-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="font-semibold text-[var(--pub-text)]">Sugerencia recibida</p>
        <p className="text-sm text-[var(--pub-text-muted)] mt-1">
          Gracias por ayudarnos a mejorar. La revisaremos pronto.
        </p>
        <button
          onClick={() => setExito(false)}
          className="mt-4 text-sm underline text-[var(--pub-text-muted)]"
        >
          Enviar otra sugerencia
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--pub-surface)] rounded-xl border border-[var(--pub-gold)]/20 p-6 flex flex-col gap-5"
      noValidate
    >
      <div>
        <h3 className="font-semibold text-[var(--pub-text)] mb-1">Enviar sugerencia</h3>
        <p className="text-sm text-[var(--pub-text-muted)]">
          Comparte ideas, quejas o cualquier comentario. Solo lo veremos nosotros.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="mensaje-sugerencia"
          className="text-sm font-medium text-[var(--pub-text)]"
        >
          Mensaje <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="mensaje-sugerencia"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value.slice(0, MAX_MENSAJE))}
          placeholder="Escribe tu sugerencia o comentario..."
          rows={5}
          required
          minLength={MIN_MENSAJE}
          className="resize-none rounded-lg border border-[var(--pub-gold)]/40 bg-[var(--pub-bg)] px-3 py-2 text-sm text-[var(--pub-text)] placeholder:text-[var(--pub-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pub-gold)] transition"
        />
        <p className="text-xs text-[var(--pub-text-muted)] text-right">
          {mensaje.length}/{MAX_MENSAJE}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || mensaje.trim().length < MIN_MENSAJE}
        className="w-full py-3 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity disabled:opacity-50"
        style={{ background: 'var(--pub-gold)' }}
      >
        {enviando ? 'Enviando...' : 'Enviar sugerencia'}
      </button>
    </form>
  )
}
