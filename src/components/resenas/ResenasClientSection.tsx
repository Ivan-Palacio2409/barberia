'use client'

import { useState } from 'react'
import type { Resena } from '@/types'
import { ResenaCard } from './ResenaCard'
import { SugerenciaForm } from './SugerenciaForm'
import { PromedioResenas } from './PromedioResenas'

interface ResenasClientSectionProps {
  resenasIniciales: Resena[]
  promedio: number
  total: number
  clienteId: string | null
}

// ============================================================
// ResenasClientSection.tsx
// Ajuste solicitado: esta seccion publica ya NO permite dejar una
// reseña aqui — ahora eso se hace desde "Mis citas" > "Mis reseñas"
// en el perfil, justo despues de confirmar asistencia a la cita
// (ver CitaCard.tsx y DejarResenaCard.tsx). Esta pagina solo debe
// mostrar las reseñas que los clientes ya dejaron.
// ============================================================

const POR_PAGINA = 6

export function ResenasClientSection({
  resenasIniciales,
  promedio,
  total: totalInicial,
  clienteId,
}: ResenasClientSectionProps) {
  const [resenas] = useState<Resena[]>(resenasIniciales)
  const [totalLocal] = useState(totalInicial)
  const [promedioLocal] = useState(promedio)
  const [pagina, setPagina] = useState(1)

  const visible = resenas.slice(0, pagina * POR_PAGINA)
  const hayMas = visible.length < resenas.length

  return (
    <div className="flex flex-col gap-10">
      {/* Promedio global */}
      <div className="bg-[var(--pub-surface)] rounded-2xl border border-[var(--pub-gold)]/20">
        <PromedioResenas promedio={promedioLocal} total={totalLocal} />
      </div>

      {/* Sugerencias — solo para clientes autenticados. Las reseñas
         se dejan desde el perfil, no aqui. */}
      {clienteId && (
        <div>
          <h2
            className="text-sm font-semibold text-[var(--pub-text)] mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Enviar sugerencia
          </h2>
          <SugerenciaForm clienteId={clienteId} />
        </div>
      )}

      {/* Lista de reseñas */}
      <div>
        <h2
          className="text-xl font-semibold text-[var(--pub-text)] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Opiniones de clientes
        </h2>

        {resenas.length === 0 ? (
          <div className="text-center py-12 text-[var(--pub-text-muted)]">
            <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <p className="text-sm">Aún no hay reseñas. Se el primero en compartir tu experiencia.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visible.map((resena) => (
                <ResenaCard key={resena.id} resena={resena} />
              ))}
            </div>

            {hayMas && (
              <div className="text-center">
                <button
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-6 py-2.5 rounded-lg border border-[var(--pub-gold)]/40 text-sm font-medium text-[var(--pub-text)] hover:bg-[var(--pub-bg)] transition"
                >
                  Ver mas reseñas
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}