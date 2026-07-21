'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ClienteConFrecuencia } from '@/services/clientes'

// ============================================================
// ClientesLista.tsx — Fase 19
// Tabla de clientes con buscador, badge "Cliente frecuente"
// y badge "Inactivo". Búsqueda server-side via query param.
// ============================================================

interface Props {
  clientes: ClienteConFrecuencia[]
  queryInicial: string
  /** Página actual (1-indexed). Solo aplica cuando no hay búsqueda activa. */
  pagina?: number
  porPagina?: number
  /** Total de clientes que cumplen el filtro (para calcular si hay página siguiente). */
  total?: number
}

function formatFecha(fecha?: string | null): string {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ClientesLista({ clientes, queryInicial, pagina = 1, porPagina = 50, total = clientes.length }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(queryInicial)
  const [, startTransition] = useTransition()

  const mostrandoPaginacion = !query && total > porPagina
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  function handleBuscar(valor: string) {
    setQuery(valor)
    startTransition(() => {
      const params = new URLSearchParams()
      if (valor.trim()) params.set('q', valor.trim())
      router.push(`/admin/clientes${params.toString() ? `?${params}` : ''}`)
    })
  }

  function irAPagina(nuevaPagina: number) {
    startTransition(() => {
      const params = new URLSearchParams()
      if (nuevaPagina > 1) params.set('page', String(nuevaPagina))
      router.push(`/admin/clientes${params.toString() ? `?${params}` : ''}`)
    })
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre, telefono o email..."
          value={query}
          onChange={(e) => handleBuscar(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Tabla */}
      {clientes.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No se encontraron clientes.
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefono</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ultima visita</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Visitas</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{cliente.nombre}</div>
                    {cliente.email && (
                      <div className="text-xs text-muted-foreground">{cliente.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cliente.telefono}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFecha(cliente.fecha_ultima_visita)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{cliente.total_citas}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {cliente.es_frecuente && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Frecuente
                        </span>
                      )}
                      {cliente.inactivo && (
                        <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clientes/${cliente.id}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación (solo en el listado completo, no en resultados de búsqueda) */}
      {mostrandoPaginacion && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Página {pagina} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => irAPagina(pagina - 1)}
              disabled={pagina <= 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/40 transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => irAPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/40 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
