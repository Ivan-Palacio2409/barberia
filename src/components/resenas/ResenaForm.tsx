'use client'

import { useState } from 'react'
import { StarRating } from './StarRating'
import { crearResena, clienteYaTieneResena } from '@/services/resenas'
import type { Resena } from '@/types'

interface ResenaFormProps {
  clienteId: string
  onCreada: (resena: Resena) => void
}

const MAX_COMENTARIO = 500

export function ResenaForm({ clienteId, onCreada }: ResenaFormProps) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (puntuacion === 0) {
      setError('Selecciona una calificación de 1 a 5 estrellas.')
      return
    }

    setEnviando(true)

    try {
      const yaExiste = await clienteYaTieneResena(clienteId)
      if (yaExiste) {
        setError('Ya has dejado una reseña anteriormente.')
        return
      }

      const nueva = await crearResena({
        cliente_id: clienteId,
        puntuacion,
        comentario: comentario.trim() || undefined,
      })

      if (nueva) {
        setExito(true)
        onCreada(nueva)
        setPuntuacion(0)
        setComentario('')
      }
    } catch {
      setError('No se pudo enviar la reseña. Inténtalo de nuevo.')
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
        <p className="font-semibold text-[var(--pub-text)]">Gracias por tu reseña</p>
        <p className="text-sm text-[var(--pub-text-muted)] mt-1">Tu opinion nos ayuda a mejorar.</p>
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
        <h3 className="font-semibold text-[var(--pub-text)] mb-1">Deja tu reseña</h3>
        <p className="text-sm text-[var(--pub-text-muted)]">
          Comparte tu experiencia con otras personas.
        </p>
      </div>

      {/* Calificacion */}
      <fieldset>
        <legend className="text-sm font-medium text-[var(--pub-text)] mb-2">
          Calificacion <span aria-hidden="true" className="text-red-500">*</span>
        </legend>
        <StarRating value={puntuacion} onChange={setPuntuacion} size="lg" />
      </fieldset>

      {/* Comentario */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="comentario-resena"
          className="text-sm font-medium text-[var(--pub-text)]"
        >
          Comentario{' '}
          <span className="text-[var(--pub-text-muted)] font-normal">(opcional)</span>
        </label>
        <textarea
          id="comentario-resena"
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, MAX_COMENTARIO))}
          placeholder="Cuéntanos cómo fue tu experiencia..."
          rows={4}
          className="resize-none rounded-lg border border-[var(--pub-gold)]/40 bg-[var(--pub-bg)] px-3 py-2 text-sm text-[var(--pub-text)] placeholder:text-[var(--pub-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pub-gold)] transition"
        />
        <p className="text-xs text-[var(--pub-text-muted)] text-right">
          {comentario.length}/{MAX_COMENTARIO}
        </p>
      </div>

      {/* Error */}
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
        disabled={enviando || puntuacion === 0}
        className="w-full py-3 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity disabled:opacity-50"
        style={{ background: 'var(--pub-gold)' }}
      >
        {enviando ? 'Enviando...' : 'Publicar reseña'}
      </button>
    </form>
  )
}
