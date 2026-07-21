'use client'

import { useState, useTransition } from 'react'
import type { Resena } from '@/types'
import { StarRating } from '@/components/resenas/StarRating'
import { cn } from '@/lib/utils'

// ============================================================
// ResenasAdminShell.tsx — Fase 22
// Panel administrativo de resenas: lista, filtros, eliminacion.
// ============================================================

interface ResenasAdminShellProps {
  resenas: Resena[]
  promedio: number
  total: number
}

function formatFecha(s: string) {
  return new Date(s).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

// Fase 27: icono de tijeras para mostrar el servicio reseñado
function ScissorsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  )
}

// Fase 27: icono de check para reseñas verificadas (con cita asociada)
function VerifiedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

const FILTROS = ['Todas', 'Verificadas', '5', '4', '3', '2', '1'] as const

export function ResenasAdminShell({ resenas: inicial, promedio, total }: ResenasAdminShellProps) {
  const [resenas, setResenas] = useState<Resena[]>(inicial)
  const [filtro, setFiltro] = useState<typeof FILTROS[number]>('Todas')
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtradas = filtro === 'Todas'
    ? resenas
    : filtro === 'Verificadas'
      ? resenas.filter(r => Boolean(r.cita_id))
      : resenas.filter(r => r.puntuacion === Number(filtro))

  const verificadas = resenas.filter(r => Boolean(r.cita_id)).length

  const distribucion = [5, 4, 3, 2, 1].map(n => ({
    estrellas: n,
    cantidad: resenas.filter(r => r.puntuacion === n).length,
    pct: resenas.length > 0
      ? Math.round((resenas.filter(r => r.puntuacion === n).length / resenas.length) * 100)
      : 0,
  }))

  async function handleEliminar(id: string) {
    if (!confirm('Eliminar esta resena permanentemente?')) return
    setEliminando(id)
    try {
      const res = await fetch(`/api/admin/resenas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        startTransition(() => setResenas(prev => prev.filter(r => r.id !== id)))
      }
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Resenas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion y moderacion de resenas de clientes.
        </p>
      </div>

      {/* Resumen estadistico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Promedio general */}
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--color-gold)" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{promedio.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Promedio general</p>
            <StarRating value={Math.round(promedio)} readonly size="sm" />
          </div>
        </div>

        {/* Total resenas */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Total de resenas</p>
          <p className="text-3xl font-bold text-foreground">{total}</p>
          <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: '#1d8a4d' }}>
            <VerifiedIcon />
            {verificadas} verificada{verificadas === 1 ? '' : 's'}
          </p>
        </div>

        {/* Distribucion */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-3">Distribucion</p>
          <div className="space-y-1.5">
            {distribucion.map(d => (
              <div key={d.estrellas} className="flex items-center gap-2">
                <span className="text-xs w-3 text-muted-foreground">{d.estrellas}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-gold)" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{d.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros por estrellas */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              filtro === f
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            )}
          >
            {f === 'Todas' || f === 'Verificadas' ? f : `${f} estrellas`}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground self-center">
          {filtradas.length} {filtradas.length === 1 ? 'resena' : 'resenas'}
        </span>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-3">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <p className="text-sm text-muted-foreground">No hay resenas con este filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(r => (
            <article key={r.id} className="bg-card rounded-xl border border-border p-5 flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-semibold bg-primary"
                aria-hidden="true"
              >
                {iniciales(r.cliente?.nombre ?? 'C')}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-medium text-foreground text-sm">
                    {r.cliente?.nombre ?? 'Cliente'}
                  </p>
                  <StarRating value={r.puntuacion} readonly size="sm" />
                  <time className="text-xs text-muted-foreground">
                    {formatFecha(r.created_at)}
                  </time>
                  {r.cita_id && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: '#eafaf0', color: '#1d8a4d' }}
                      title="Resena vinculada a una cita real"
                    >
                      <VerifiedIcon />
                      Verificada
                    </span>
                  )}
                </div>
                {r.cita && r.cita.servicios_nombres.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ScissorsIcon />
                    <span className="truncate">{r.cita.servicios_nombres.join(', ')}</span>
                  </div>
                )}
                {r.comentario && (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {r.comentario}
                  </p>
                )}
              </div>

              {/* Accion eliminar */}
              <button
                onClick={() => handleEliminar(r.id)}
                disabled={eliminando === r.id}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                title="Eliminar resena"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
