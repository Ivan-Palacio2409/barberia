'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getCitasByCliente } from '@/lib/citas'
import { CitaCard } from '@/components/mis-citas/CitaCard'
import { ModalReagendar } from '@/components/mis-citas/ModalReagendar'
import { ModalCancelar } from '@/components/mis-citas/ModalCancelar'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { useMisCitasRealtime } from '@/hooks/useMisCitasRealtime'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CitaConServicios } from '@/types'

// ── Iconos SVG ───────────────────────────────────────────────
function CalendarPlusIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M12 15v4M10 17h4" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  )
}

function RealtimeDot({ activo }: { activo: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 ml-1.5" title={activo ? 'Sincronizacion en tiempo real activa' : 'Conectando...'}>
      {activo && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', activo ? 'bg-green-500' : 'bg-muted-foreground/30')} />
    </span>
  )
}

// ── Tabs ─────────────────────────────────────────────────────
type Tab = 'proximas' | 'historial'

const TABS: { id: Tab; label: string }[] = [
  { id: 'proximas',  label: 'Proximas' },
  { id: 'historial', label: 'Historial' },
]

// ── Componente ───────────────────────────────────────────────
export default function MisCitasPage() {
  const { user, getClienteId, loading: authLoading } = useAuth()
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [citas, setCitas] = useState<CitaConServicios[]>([])
  const [loadingCitas, setLoadingCitas] = useState(true)
  const [tab, setTab] = useState<Tab>('proximas')
  const [citaReagendar, setCitaReagendar] = useState<CitaConServicios | null>(null)
  const [citaCancelar, setCitaCancelar] = useState<CitaConServicios | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [realtimeActivo, setRealtimeActivo] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)

  // ── Cargar clienteId ─────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return
    getClienteId().then(setClienteId)
  }, [user, authLoading, getClienteId])

  // ── Cargar citas ─────────────────────────────────────────────
  const cargarCitas = useCallback(async () => {
    if (!clienteId) return
    setLoadingCitas(true)
    setError(null)
    try {
      const data = await getCitasByCliente(clienteId)
      setCitas(data)
    } catch {
      setError('No se pudieron cargar tus citas. Intenta de nuevo.')
    } finally {
      setLoadingCitas(false)
    }
  }, [clienteId])

  useEffect(() => {
    cargarCitas()
  }, [cargarCitas])

  // ── Realtime — Fase 23 ────────────────────────────────────────
  useMisCitasRealtime(clienteId, (citaCambiada, tipo) => {
    setRealtimeActivo(true)

    if (tipo === 'DELETE' && citaCambiada.id) {
      setCitas(prev => prev.filter(c => c.id !== citaCambiada.id))
      return
    }

    if (!citaCambiada.id) return

    setCitas(prev => {
      const existe = prev.find(c => c.id === citaCambiada.id)

      if (tipo === 'INSERT') {
        if (existe) return prev
        // La nueva cita llega sin join de servicios; recargamos del servidor
        cargarCitas()
        return prev
      }

      if (tipo === 'UPDATE') {
        if (!existe) {
          cargarCitas()
          return prev
        }
        // Actualizar campos escalares; mantener join de servicios
        return prev.map(c =>
          c.id === citaCambiada.id
            ? { ...c, ...citaCambiada, servicios: c.servicios }
            : c
        )
      }

      return prev
    })

    // Flash visual en la cita cambiada
    if (citaCambiada.id) {
      setFlashId(citaCambiada.id)
      setTimeout(() => setFlashId(null), 2000)
    }
  })

  // ── Filtrar citas por tab ────────────────────────────────────
  const hoy = new Date().toISOString().split('T')[0]

  const citasProximas = citas.filter(
    (c) => c.fecha >= hoy && (c.estado === 'pendiente' || c.estado === 'confirmada')
  )

  const citasHistorial = citas.filter(
    (c) => c.estado === 'completada' || c.estado === 'cancelada' || c.fecha < hoy
  )

  const citasMostradas = tab === 'proximas' ? citasProximas : citasHistorial

  // ── Handler de exito en modal ────────────────────────────────
  const handleModalSuccess = () => {
    setCitaReagendar(null)
    setCitaCancelar(null)
    cargarCitas()
  }

  // ── Loading ──────────────────────────────────────────────────
  if (authLoading || (user && !clienteId && loadingCitas)) {
    return <PageLoader />
  }

  return (
    <main className="cliente-perfil-theme min-h-screen bg-background pt-24 pb-20 lg:pt-28">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Titulo */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Mis citas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gestiona tus citas proximas e historial de visitas
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Indicador Realtime */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RealtimeDot activo={realtimeActivo} />
              <span className="hidden sm:inline">En vivo</span>
            </div>
            {/* Volver al inicio */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-full px-3.5 py-2 transition-colors"
            >
              <HomeIcon />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="mb-6 flex rounded-xl border border-border bg-muted/40 p-1"
          role="tablist"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {t.id === 'proximas' && citasProximas.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {citasProximas.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Lista de citas */}
        {loadingCitas ? (
          <PageLoader />
        ) : citasMostradas.length === 0 ? (
          <EmptyTab tab={tab} />
        ) : (
          <div className="space-y-4">
            {citasMostradas.map((cita) => (
              <div
                key={cita.id}
                className={cn(
                  'transition-all duration-500',
                  flashId === cita.id && 'ring-2 ring-primary/40 rounded-2xl'
                )}
              >
                <CitaCard
                  cita={cita}
                  clienteId={clienteId ?? undefined}
                  onReagendar={(c) => setCitaReagendar(c)}
                  onCancelar={(c) => setCitaCancelar(c)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal reagendar */}
      {citaReagendar && clienteId && (
        <ModalReagendar
          cita={citaReagendar}
          clienteId={clienteId}
          onClose={() => setCitaReagendar(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Modal cancelar */}
      {citaCancelar && clienteId && (
        <ModalCancelar
          cita={citaCancelar}
          clienteId={clienteId}
          onClose={() => setCitaCancelar(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </main>
  )
}

// ── Estado vacio ─────────────────────────────────────────────
function EmptyTab({ tab }: { tab: Tab }) {
  if (tab === 'proximas') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarPlusIcon />
        </div>
        <div>
          <p className="font-display text-base font-semibold text-foreground">No tienes citas proximas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reserva tu proxima cita y aparecera aqui
          </p>
        </div>
        <Button asChild>
          <Link href="/reservar">Reservar ahora</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CalendarPlusIcon />
      </div>
      <div>
        <p className="font-display text-base font-semibold text-foreground">Sin historial aun</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus citas completadas y canceladas apareceran aqui
        </p>
      </div>
    </div>
  )
}