'use client'

// ============================================================
// GrillaEstilos.tsx — Fase 20
// Cuadrícula masonry-like para los diseños del catálogo admin.
// Permite destacar/quitar y eliminar con confirmación.
// ============================================================

import { useState } from 'react'
import type { CatalogoEstilo } from '@/types'
import { eliminarEstiloAdmin, toggleDestacadoEstilo } from '@/services/catalogo'

interface Props {
  estilos:   CatalogoEstilo[]
  onEdit:    (d: CatalogoEstilo) => void
  onDeleted: () => void
}

export function GrillaEstilos({ estilos, onEdit, onDeleted }: Props) {
  const [confirmId,  setConfirmId]  = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleToggle = async (id: string, destacado: boolean) => {
    setTogglingId(id)
    await toggleDestacadoEstilo(id, destacado)
    setTogglingId(null)
    onDeleted()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const ok = await eliminarEstiloAdmin(id)
    setDeletingId(null)
    setConfirmId(null)
    if (ok) onDeleted()
  }

  if (estilos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="mb-4 h-12 w-12 text-muted-foreground/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <p className="text-sm text-muted-foreground">No hay diseños en el catálogo</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {estilos.map((d) => (
        <div
          key={d.id}
          className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Imagen */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            {d.imagen_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.imagen_url}
                alt={d.titulo}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg className="h-10 w-10 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}

            {/* Badge destacado */}
            {d.destacado && (
              <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase tracking-wide">
                Destacado
              </span>
            )}

            {/* Overlay de acciones */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {/* Editar */}
              <button
                onClick={() => onEdit(d)}
                className="rounded-full bg-card/90 p-2 text-foreground hover:bg-card transition-colors shadow"
                title="Editar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {/* Destacar / quitar destacado */}
              <button
                onClick={() => handleToggle(d.id, !d.destacado)}
                disabled={togglingId === d.id}
                className={`rounded-full p-2 transition-colors shadow ${
                  d.destacado
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-card/90 text-foreground hover:bg-card'
                }`}
                title={d.destacado ? 'Quitar destacado' : 'Marcar destacado'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={d.destacado ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>

              {/* Eliminar */}
              {confirmId === d.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="rounded px-2 py-1 text-xs bg-destructive text-white hover:bg-destructive/90 transition-colors shadow"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded px-2 py-1 text-xs bg-card/90 text-foreground hover:bg-card transition-colors shadow"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(d.id)}
                  className="rounded-full bg-card/90 p-2 text-destructive hover:bg-card transition-colors shadow"
                  title="Eliminar"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <p className="text-sm font-medium text-foreground truncate">{d.titulo}</p>
          </div>
        </div>
      ))}
    </div>
  )
}