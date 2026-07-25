'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { crearResena } from '@/services/resenas'
import type { CitaConServicios } from '@/types'

// ============================================================
// DejarResenaCard.tsx
// Tarjeta "Deja tu reseña" para /cliente/perfil > Mis reseñas.
//
// Reemplaza el formulario que antes vivia en la seccion publica
// de Reseñas (ver ResenasClientSection.tsx) y en el modal de
// "Mis citas" (ver ModalResena.tsx, ya no se usa desde ahi). Se
// muestra unicamente para citas completadas, con asistencia
// confirmada por el cliente y dentro de las 24 horas siguientes
// a esa confirmacion (ver getCitasPendientesDeResena en
// services/resenas.ts) — pasado ese plazo, esta tarjeta deja de
// aparecer para esa cita.
// ============================================================

interface DejarResenaCardProps {
  cita: CitaConServicios
  clienteId: string
  onEnviada: (citaId: string) => void
}

const MAX_COMENTARIO = 500

function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function SelectorEstrellas({
  valor,
  onChange,
  disabled,
}: {
  valor: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Calificacion">
      {[1, 2, 3, 4, 5].map((n) => {
        const activa = n <= (hover || valor)
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrellas`}
            className={cn(
              'transition-transform focus:outline-none',
              disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <svg
              width="28" height="28" viewBox="0 0 24 24"
              fill={activa ? 'hsl(var(--foreground))' : 'none'}
              stroke={activa ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export function DejarResenaCard({ cita, clienteId, onEnviada }: DejarResenaCardProps) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const servicios = (cita.cita_servicios ?? []).map((cs) => cs.servicio)
  const nombreServicio = servicios.map((s) => s.nombre).filter(Boolean).join(', ') || 'tu cita'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (puntuacion === 0) {
      setError('Selecciona una calificación antes de publicar.')
      return
    }

    setEnviando(true)
    try {
      await crearResena({
        cliente_id: clienteId,
        puntuacion,
        comentario: comentario.trim() || undefined,
        cita_id: cita.id,
      })
      onEnviada(cita.id)
    } catch (err) {
      const code = typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: string }).code
        : undefined
      setError(
        code === '23505'
          ? 'Ya dejaste una reseña para esta cita.'
          : 'No se pudo publicar la reseña. Intenta de nuevo.'
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border bg-card p-5 space-y-5"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <div>
        <h3 className="font-display text-base font-semibold text-foreground">Deja tu reseña</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Comparte tu experiencia con {nombreServicio} el {formatearFecha(cita.fecha)}.
        </p>
      </div>

      {/* Calificacion */}
      <fieldset>
        <legend className="text-sm font-medium text-foreground mb-2">
          Calificación <span aria-hidden="true" className="text-destructive">*</span>
        </legend>
        <SelectorEstrellas valor={puntuacion} onChange={setPuntuacion} disabled={enviando} />
      </fieldset>

      {/* Comentario */}
      <div className="space-y-1.5">
        <label htmlFor="comentario-resena-perfil" className="text-sm font-medium text-foreground">
          Comentario <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="comentario-resena-perfil"
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, MAX_COMENTARIO))}
          placeholder="Cuéntanos cómo fue tu experiencia..."
          rows={4}
          disabled={enviando}
          className="w-full resize-none rounded-lg border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
          style={{ borderColor: 'hsl(var(--border))' }}
        />
        <p className="text-xs text-muted-foreground text-right">
          {comentario.length}/{MAX_COMENTARIO}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={enviando || puntuacion === 0}
        className="w-full"
      >
        {enviando ? 'Publicando...' : 'Publicar reseña'}
      </Button>
    </form>
  )
}