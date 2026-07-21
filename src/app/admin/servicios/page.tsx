'use client'

// ============================================================
// /admin/servicios — Fase 20
// Gestión completa de servicios: listar, crear, editar,
// activar/desactivar y eliminar.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import type { Servicio, CategoriaServicio } from '@/types'
import { getAllServiciosAdmin } from '@/services/servicios'
import { getCategorias as getCategoriasServicio } from '@/services/categorias'
import { TablaServicios } from '@/components/admin/servicios/TablaServicios'
import { ModalServicio } from '@/components/admin/servicios/ModalServicio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

type ServicioConCat = Servicio & { categoria: CategoriaServicio }

export default function AdminServiciosPage() {
  const [servicios,   setServicios]   = useState<ServicioConCat[]>([])
  const [categorias,  setCategorias]  = useState<CategoriaServicio[]>([])
  const [loading,     setLoading]     = useState(true)
  const [busqueda,    setBusqueda]    = useState('')
  const [filtro,      setFiltro]      = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [editando,    setEditando]    = useState<Servicio | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [svcs, cats] = await Promise.all([
      getAllServiciosAdmin(),
      getCategoriasServicio(),
    ])
    setServicios(svcs as ServicioConCat[])
    setCategorias(cats)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => { setEditando(null); setModalAbierto(true) }
  const abrirEditar = (s: Servicio) => { setEditando(s); setModalAbierto(true) }
  const cerrar = () => setModalAbierto(false)
  const guardar = () => { setModalAbierto(false); cargar() }

  const serviciosFiltrados = servicios.filter((s) => {
    const matchBusqueda =
      busqueda === '' ||
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.categoria?.nombre?.toLowerCase().includes(busqueda.toLowerCase())

    const matchFiltro =
      filtro === 'todos' ||
      (filtro === 'activos' && s.activo) ||
      (filtro === 'inactivos' && !s.activo)

    return matchBusqueda && matchFiltro
  })

  const totalActivos   = servicios.filter((s) => s.activo).length
  const totalInactivos = servicios.filter((s) => !s.activo).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Servicios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona el catálogo de servicios del salón
          </p>
        </div>
        <Button onClick={abrirNuevo} className="shrink-0">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo servicio
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: servicios.length, color: 'text-foreground' },
          { label: 'Activos', value: totalActivos, color: 'text-green-600' },
          { label: 'Inactivos', value: totalInactivos, color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Buscar por nombre o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-card overflow-hidden shrink-0">
          {(['todos', 'activos', 'inactivos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                filtro === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <TablaServicios
          servicios={serviciosFiltrados}
          onEdit={abrirEditar}
          onDeleted={cargar}
        />
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalServicio
          servicio={editando}
          categorias={categorias}
          onClose={cerrar}
          onSaved={guardar}
        />
      )}
    </div>
  )
}
