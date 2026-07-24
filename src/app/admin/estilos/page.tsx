'use client'

// ============================================================
// /admin/estilos — Fase 20 (simplificado)
// Gestión del catálogo de diseños con cuadrícula visual.
// Sin categorías: la galería pública solo muestra imágenes.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import type { CatalogoEstilo } from '@/types'
import { getAllEstilosAdmin } from '@/services/catalogo'
import { GrillaEstilos } from '@/components/admin/estilos/GrillaEstilos'
import { ModalEstilo } from '@/components/admin/estilos/ModalEstilo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function AdminEstilosPage() {
  const [estilos,      setEstilos]      = useState<CatalogoEstilo[]>([])
  const [loading,      setLoading]      = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [soloDestacados, setSoloDestacados] = useState(false)
  const [editando,     setEditando]     = useState<CatalogoEstilo | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const dsns = await getAllEstilosAdmin()
    setEstilos(dsns)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo  = () => { setEditando(null); setModalAbierto(true) }
  const abrirEditar = (d: CatalogoEstilo) => { setEditando(d); setModalAbierto(true) }
  const cerrar      = () => setModalAbierto(false)
  const guardar     = () => { setModalAbierto(false); cargar() }

  const estilosFiltrados = estilos.filter((d) => {
    const matchBusqueda =
      busqueda === '' || d.titulo.toLowerCase().includes(busqueda.toLowerCase())

    const matchDestacado = !soloDestacados || d.destacado

    return matchBusqueda && matchDestacado
  })

  const totalDestacados = estilos.filter((d) => d.destacado).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Galería</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra las fotos y diseños visibles en la galería pública
          </p>
        </div>
        <Button onClick={abrirNuevo} className="shrink-0">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo diseño
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total diseños', value: estilos.length, color: 'text-foreground' },
          { label: 'Destacados', value: totalDestacados, color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Buscar por título..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Toggle destacados */}
        <button
          onClick={() => setSoloDestacados(!soloDestacados)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors shrink-0 ${
            soloDestacados
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={soloDestacados ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Solo destacados
        </button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <GrillaEstilos
          estilos={estilosFiltrados}
          onEdit={abrirEditar}
          onDeleted={cargar}
        />
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalEstilo
          estilo={editando}
          onClose={cerrar}
          onSaved={guardar}
        />
      )}
    </div>
  )
}