'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { buscarPorAuthUserId } from '@/services/clientes'
import { getCitasByCliente } from '@/services/citas'
import { EditarPerfilForm } from '@/components/perfil/EditarPerfilForm'
import { MisDatosPrivacidad } from '@/components/perfil/MisDatosPrivacidad'
import { MisResenas } from '@/components/perfil/MisResenas'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { Cliente, Cita } from '@/types'

// ── Iconos SVG ───────────────────────────────────────────────
function UserIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

// ── Tabs ─────────────────────────────────────────────────────
type Tab = 'perfil' | 'historial' | 'resenas' | 'privacidad'

const TABS: { id: Tab; label: string }[] = [
  { id: 'perfil',     label: 'Mi perfil' },
  { id: 'historial',  label: 'Historial' },
  { id: 'resenas',    label: 'Mis resenas' },
  { id: 'privacidad', label: 'Privacidad' },
]

// ── Helpers ──────────────────────────────────────────────────
function formatCOP(monto: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Componente ───────────────────────────────────────────────
export default function PerfilPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [citas, setCitas] = useState<Cita[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [tab, setTab] = useState<Tab>('perfil')
  const [profileKey, setProfileKey] = useState(0) // fuerza re-render del form tras guardar

  const cargarDatos = useCallback(async () => {
    if (!user) return
    setLoadingData(true)

    const clienteData = await buscarPorAuthUserId(user.id)

    setCliente(clienteData)

    if (clienteData) {
      const c = await getCitasByCliente(clienteData.id)
      setCitas(c)
    }

    setLoadingData(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && user) cargarDatos()
    else if (!authLoading && !user) setLoadingData(false)
  }, [user, authLoading, cargarDatos])

  if (authLoading || loadingData) return <PageLoader />

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Debes iniciar sesion para ver tu perfil.</p>
          <Link href="/login" className="text-accent hover:text-accent/80 font-medium text-sm">
            Iniciar sesion
          </Link>
        </div>
      </div>
    )
  }

  // ── Calcular estadisticas ────────────────────────────────────
  const citasCompletadas = citas.filter((c) => c.estado === 'completada')
  const totalInvertido = citasCompletadas
    .reduce((acc, c) => acc + Number(c.precio_total ?? 0), 0)

  return (
    <div className="cliente-perfil-theme min-h-screen bg-background">
      {/* ── Header del perfil ──────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              {profile.foto_perfil ? (
                <img src={profile.foto_perfil} alt={profile.nombre} className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-semibold text-foreground truncate">{profile.nombre}</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Volver al inicio */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-full px-3.5 py-2 transition-colors flex-shrink-0"
            >
              <HomeIcon />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </div>

          {/* Estadisticas rapidas */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
            <div className="text-center min-w-0 px-1">
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{citasCompletadas.length}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Citas completadas</p>
            </div>
            <div className="text-center min-w-0 px-1 border-x border-border">
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{formatCOP(totalInvertido)}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Total en servicios</p>
            </div>
            <div className="text-center min-w-0 px-1">
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                {cliente?.fecha_ultima_visita
                  ? new Date(cliente.fecha_ultima_visita).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                  : '—'}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Ultima visita</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  tab === t.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido por tab ──────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* --- Mi perfil --- */}
        {tab === 'perfil' && profile && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <EditarPerfilForm
              key={profileKey}
              profile={profile}
              cliente={cliente}
              onSaved={() => {
                setProfileKey((k) => k + 1)
                refreshProfile()
                cargarDatos()
              }}
            />
          </div>
        )}

        {/* --- Historial --- */}
        {tab === 'historial' && (
          <div className="space-y-3">
            {citas.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-3 shadow-sm">
                <div className="flex justify-center text-muted-foreground/50">
                  <CalendarIcon />
                </div>
                <p className="text-muted-foreground text-sm">Aun no tienes citas registradas.</p>
                <Link href="/reservar" className="inline-block text-sm text-accent hover:text-accent/80 font-medium">
                  Reservar ahora
                </Link>
              </div>
            ) : (
              citas.map((cita) => (
                <div key={cita.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CalendarIcon />
                      <span className="font-medium">{formatFecha(cita.fecha)}</span>
                      <span className="text-muted-foreground/70">{cita.hora_inicio?.slice(0, 5)}</span>
                    </div>
                    <EstadoBadge estado={cita.estado} />
                  </div>

                  {cita.servicios && cita.servicios.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {cita.servicios.map((s) => s.nombre).join(', ')}
                    </p>
                  )}

                  {cita.precio_total != null && (
                    <p className="text-sm font-semibold text-foreground">
                      {formatCOP(cita.precio_total)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- Mis resenas --- */}
        {tab === 'resenas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Mis resenas
              </h2>
            </div>
            {cliente ? (
              <MisResenas clienteId={cliente.id} />
            ) : (
              <p className="text-sm text-muted-foreground italic">No se encontro tu registro de cliente.</p>
            )}
          </div>
        )}

        {/* --- Privacidad (ARCO) --- */}
        {tab === 'privacidad' && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            {cliente ? (
              <MisDatosPrivacidad clienteId={cliente.id} userEmail={user.email} />
            ) : (
              <p className="text-sm text-muted-foreground italic">No se encontro tu registro de cliente.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Badge de estado de cita ──────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    pendiente:   'bg-warning-light text-warning-dark',
    confirmada:  'bg-accent/10 text-accent',
    completada:  'bg-success-light text-success-dark',
    cancelada:   'bg-destructive/10 text-destructive',
  }
  const labels: Record<string, string> = {
    pendiente:  'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada:  'Cancelada',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[estado] ?? 'bg-muted text-muted-foreground'}`}>
      {labels[estado] ?? estado}
    </span>
  )
}