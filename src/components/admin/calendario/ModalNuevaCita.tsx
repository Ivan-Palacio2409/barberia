'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { actionCrearCitaManual } from '@/app/actions/admin-calendario'
import type { Cliente, Servicio } from '@/types'

// ============================================================
// ModalNuevaCita.tsx — Fase 18
// Modal para crear una cita manualmente desde el calendario.
// ============================================================

interface Props {
  slotInicial: { fecha: string; hora: string } | null
  onCreada: () => void
  onCerrar: () => void
}

export function ModalNuevaCita({ slotInicial, onCreada, onCerrar }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(slotInicial?.fecha ?? new Date().toISOString().slice(0, 10))
  const [hora, setHora] = useState(slotInicial?.hora ?? '09:00')
  const [servicioIds, setServicioIds] = useState<string[]>([])
  const [notas, setNotas] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('servicios').select('id, nombre, duracion_minutos, precio, categoria_id, activo, created_at').eq('activo', true).order('nombre').then(({ data }) => {
      setServicios((data ?? []) as Servicio[])
    })
    supabase.from('clientes').select('id, nombre, telefono, email, created_at, updated_at').order('nombre').then(({ data }) => {
      setClientes((data ?? []) as Cliente[])
    })
  }, [])

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono ?? '').includes(busqueda)
  )

  function toggleServicio(id: string) {
    setServicioIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!clienteId) return setError('Selecciona un cliente.')
    if (servicioIds.length === 0) return setError('Selecciona al menos un servicio.')
    setError('')
    setCargando(true)
    const res = await actionCrearCitaManual({ cliente_id: clienteId, fecha, hora_inicio: hora, servicio_ids: servicioIds, notas: notas || undefined })
    setCargando(false)
    if (res.error) {
      setError(res.error)
    } else {
      onCreada()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Nueva cita</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Hora inicio</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Cliente</label>
            <input
              type="text"
              placeholder="Buscar por nombre o telefono..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setClienteId('') }}
              className="mt-1 w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {busqueda && clientesFiltrados.length > 0 && !clienteId && (
              <ul className="mt-1 border border-border bg-card rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                {clientesFiltrados.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => { setClienteId(c.id); setBusqueda(c.nombre) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      {c.nombre}
                      {c.telefono && <span className="text-muted-foreground ml-2 text-xs">{c.telefono}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {busqueda && clientesFiltrados.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Sin resultados.</p>
            )}
          </div>

          {/* Servicios */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Servicios</label>
            <div className="mt-1 border border-border bg-card rounded-lg max-h-44 overflow-y-auto divide-y divide-border">
              {servicios.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={servicioIds.includes(s.id)}
                    onChange={() => toggleServicio(s.id)}
                    className="accent-primary"
                  />
                  <span className="flex-1 text-sm text-foreground">{s.nombre || 'Servicio sin nombre'}</span>
                  <span className="text-xs text-muted-foreground">{s.duracion_minutos} min</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cargando}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {cargando ? 'Creando...' : 'Crear cita'}
          </button>
        </div>
      </div>
    </div>
  )
}