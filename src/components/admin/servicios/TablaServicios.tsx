'use client'

// ============================================================
// TablaServicios.tsx — Fase 20
// Tabla agrupada por categoría con toggle activo/inactivo,
// edición inline y eliminación con confirmación.
// ============================================================

import { useState } from 'react'
import type { Servicio, CategoriaServicio } from '@/types'
import { toggleActivoServicio, eliminarServicio } from '@/services/servicios'
import { Badge } from '@/components/ui/badge'

type ServicioConCat = Servicio & { categoria: CategoriaServicio }

interface Props {
  servicios: ServicioConCat[]
  onEdit:    (s: Servicio) => void
  onDeleted: () => void
}

export function TablaServicios({ servicios, onEdit, onDeleted }: Props) {
  const [toggling, setToggling]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Agrupar por categoría
  const grouped = servicios.reduce<Record<string, { catNombre: string; items: ServicioConCat[] }>>(
    (acc, s) => {
      const key = s.categoria_id
      if (!acc[key]) acc[key] = { catNombre: s.categoria?.nombre ?? 'Sin categoría', items: [] }
      acc[key].items.push(s)
      return acc
    },
    {}
  )

  const handleToggle = async (id: string, activo: boolean) => {
    setToggling(id)
    await toggleActivoServicio(id, activo)
    setToggling(null)
    onDeleted() // reutilizamos el callback de refresh
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const result = await eliminarServicio(id)
    setDeleting(null)
    setConfirmId(null)
    if (!result.ok) {
      alert(result.mensaje ?? 'No se pudo eliminar')
      return
    }
    onDeleted()
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p)

  if (servicios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="mb-4 h-12 w-12 text-muted-foreground/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <p className="text-sm text-muted-foreground">No hay servicios registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.values(grouped).map(({ catNombre, items }) => (
        <div key={catNombre} className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Cabecera de categoría */}
          <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{catNombre}</span>
            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          </div>

          {/* Filas */}
          <div className="divide-y divide-border">
            {items.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${s.activo ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {s.nombre}
                    </span>
                    {!s.activo && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                  </div>
                  {s.descripcion && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.descripcion}</p>
                  )}
                </div>

                {/* Precio */}
                <span className="text-sm font-medium text-foreground w-28 text-right shrink-0">
                  {formatPrice(s.precio)}
                </span>

                {/* Duración */}
                <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                  {s.duracion_minutos} min
                </span>

                {/* Toggle activo */}
                <button
                  onClick={() => handleToggle(s.id, !s.activo)}
                  disabled={toggling === s.id}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                  style={{ backgroundColor: s.activo ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
                  aria-label={s.activo ? 'Desactivar' : 'Activar'}
                  title={s.activo ? 'Desactivar servicio' : 'Activar servicio'}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform"
                    style={{ transform: s.activo ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </button>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(s)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Editar"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  {confirmId === s.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="rounded px-2 py-1 text-xs bg-destructive text-white hover:bg-destructive/90 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded px-2 py-1 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
