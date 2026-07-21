'use client'

import { useState } from 'react'
import type { Resena } from '@/types'
import { ResenaCard } from './ResenaCard'
import { ResenaForm } from './ResenaForm'
import { SugerenciaForm } from './SugerenciaForm'
import { PromedioResenas } from './PromedioResenas'

interface ResenasClientSectionProps {
  resenasIniciales: Resena[]
  promedio: number
  total: number
  clienteId: string | null
}

const POR_PAGINA = 6

export function ResenasClientSection({
  resenasIniciales,
  promedio,
  total: totalInicial,
  clienteId,
}: ResenasClientSectionProps) {
  const [resenas, setResenas] = useState<Resena[]>(resenasIniciales)
  const [totalLocal, setTotalLocal] = useState(totalInicial)
  const [promedioLocal, setPromedioLocal] = useState(promedio)
  const [pagina, setPagina] = useState(1)
  const [tab, setTab] = useState<'resenas' | 'sugerencia'>('resenas')

  function agregarResena(nueva: Resena) {
    const nuevasResenas = [nueva, ...resenas]
    setResenas(nuevasResenas)
    const nuevoTotal = totalLocal + 1
    setTotalLocal(nuevoTotal)
    // Recalcular promedio local
    const suma = nuevasResenas.reduce((acc, r) => acc + r.puntuacion, 0)
    setPromedioLocal(Math.round((suma / nuevoTotal) * 10) / 10)
  }

  const visible = resenas.slice(0, pagina * POR_PAGINA)
  const hayMas = visible.length < resenas.length

  return (
    <div className="flex flex-col gap-10">
      {/* Promedio global */}
      <div className="bg-[var(--pub-surface)] rounded-2xl border border-[var(--pub-gold)]/20">
        <PromedioResenas promedio={promedioLocal} total={totalLocal} />
      </div>

      {/* Formularios — solo para clientes autenticados */}
      {clienteId ? (
        <div>
          {/* Tabs */}
          <div className="flex rounded-lg border border-[var(--pub-gold)]/30 overflow-hidden mb-6 bg-[var(--pub-surface)]">
            {[
              { key: 'resenas', label: 'Dejar reseña' },
              { key: 'sugerencia', label: 'Enviar sugerencia' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as typeof tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'bg-[var(--pub-gold)] text-[var(--pub-on-gold)]'
                    : 'text-[var(--pub-text-muted)] hover:bg-[var(--pub-bg)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'resenas' ? (
            <ResenaForm clienteId={clienteId} onCreada={agregarResena} />
          ) : (
            <SugerenciaForm clienteId={clienteId} />
          )}
        </div>
      ) : (
        <div className="bg-[var(--pub-bg)] rounded-xl border border-[var(--pub-gold)]/20 p-6 text-center">
          <p className="text-sm text-[var(--pub-text-muted)] mb-3">
            Inicia sesion para dejar una reseña o enviar una sugerencia.
          </p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)] transition-opacity hover:opacity-90"
            style={{ background: 'var(--pub-gold)' }}
          >
            Iniciar sesion
          </a>
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
