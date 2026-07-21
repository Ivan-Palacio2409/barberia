'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { citaYaTieneResena } from '@/services/resenas'
import { marcarAsistencia } from '@/services/citas'
import { ModalResena } from './ModalResena'
import type { CitaConServicios, EstadoCita } from '@/types'

// ============================================================
// CitaCard.tsx — Fase 26 (+ flujo de asistencia post-cita)
// Agrega boton "Dejar resena" en citas completadas. El boton se
// oculta automaticamente si la cita ya tiene resena. Cuando ya
// paso la hora estimada de fin y aun no se confirmo asistencia,
// muestra "¿Asististe?" en vez de Reagendar/Cancelar.
// ============================================================

const ESTADO_CONFIG: Record<
  EstadoCita,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' | 'gold' }
> = {
  pendiente:  { label: 'Pendiente',  variant: 'warning' },
  confirmada: { label: 'Confirmada', variant: 'success' },
  completada: { label: 'Completada', variant: 'gold' },
  cancelada:  { label: 'Cancelada',  variant: 'destructive' },
  no_asistio: { label: 'No asististe', variant: 'outline' },
}

// ── Iconos SVG ───────────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function ScissorsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ── Props ────────────────────────────────────────────────────
interface CitaCardProps {
  cita: CitaConServicios
  clienteId?: string          // Fase 26: necesario para el modal de resena
  onReagendar: (cita: CitaConServicios) => void
  onCancelar: (cita: CitaConServicios) => void
}

// ── Utilidades de formato ────────────────────────────────────
function formatearFecha(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatearHora(hora: string): string {
  const [h, m] = hora.split(':')
  const hNum = parseInt(h, 10)
  const ampm = hNum >= 12 ? 'pm' : 'am'
  const h12 = hNum % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatearPrecio(precio?: number): string {
  if (!precio) return ''
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio)
}

// ── Componente principal ─────────────────────────────────────
export function CitaCard({ cita, clienteId, onReagendar, onCancelar }: CitaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false)
  const [yaReseno, setYaReseno] = useState<boolean | null>(null)

  const config = ESTADO_CONFIG[cita.estado]
  const finPaso = new Date(`${cita.fecha}T${cita.hora_fin}`).getTime() < Date.now()
  const esActiva = (cita.estado === 'pendiente' || cita.estado === 'confirmada') && !finPaso
  const necesitaAsistencia = (cita.estado === 'pendiente' || cita.estado === 'confirmada') && finPaso
  const esCompletada = cita.estado === 'completada'
  const [confirmandoAsistencia, setConfirmandoAsistencia] = useState(false)
  const [asistenciaEnviada, setAsistenciaEnviada] = useState(false)

  const confirmarAsistencia = async (asistio: boolean) => {
    if (!clienteId) return
    setConfirmandoAsistencia(true)
    const resultado = await marcarAsistencia(cita.id, clienteId, asistio, 'cliente')
    setConfirmandoAsistencia(false)
    if (resultado) setAsistenciaEnviada(true)
  }

  const servicios = cita.cita_servicios?.map((cs) => cs.servicio) ?? []

  // Verificar si ya tiene resena (solo para completadas)
  useEffect(() => {
    if (!esCompletada) return
    citaYaTieneResena(cita.id).then(setYaReseno)
  }, [cita.id, esCompletada])

  const handleResenaExitosa = () => {
    setModalResenaAbierto(false)
    setYaReseno(true)
  }

  const mostrarBotonResena = esCompletada && clienteId && yaReseno === false

  return (
    <>
      <article
        className={cn(
          'rounded-2xl border border-border bg-card transition-shadow hover:shadow-md',
          cita.estado === 'cancelada' && 'opacity-70'
        )}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-2 min-w-0">
            {/* Fecha y hora */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon />
                <span className="capitalize">{formatearFecha(cita.fecha)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon />
                <span>{formatearHora(cita.hora_inicio)} – {formatearHora(cita.hora_fin)}</span>
              </span>
            </div>

            {/* Servicios (resumen) */}
            {servicios.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <ScissorsIcon />
                <span className="truncate">
                  {servicios.length === 1
                    ? servicios[0].nombre
                    : `${servicios[0].nombre} + ${servicios.length - 1} mas`}
                </span>
              </div>
            )}

            {/* Precio */}
            {cita.precio_total && (
              <p className="text-sm font-semibold text-foreground">
                {formatearPrecio(cita.precio_total)}
              </p>
            )}
          </div>

          {/* Badge de estado */}
          <div className="shrink-0">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>

        {/* Detalle expandible */}
        {expanded && servicios.length > 1 && (
          <div className="border-t border-border px-5 py-4 sm:px-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Servicios
            </p>
            <ul className="space-y-1.5">
              {servicios.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm text-foreground">
                  <span>{s.nombre}</span>
                  <span className="text-muted-foreground">
                    {formatearPrecio(s.precio)} · {s.duracion_minutos} min
                  </span>
                </li>
              ))}
            </ul>
            {cita.notas && (
              <p className="mt-3 text-sm text-muted-foreground italic">
                Nota: {cita.notas}
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 sm:px-6">
          {/* Expandir detalle si hay varios servicios */}
          {servicios.length > 1 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? 'Ocultar detalle' : 'Ver detalle'}
            </button>
          )}
          {servicios.length <= 1 && <span />}

          <div className="flex items-center gap-2">
            {/* Boton resena — solo citas completadas sin resena */}
            {mostrarBotonResena && (
              <button
                onClick={() => setModalResenaAbierto(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
              >
                <StarIcon />
                Dejar resena
              </button>
            )}

            {/* Badge: ya reseno */}
            {esCompletada && yaReseno === true && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <StarIcon filled />
                Resena enviada
              </span>
            )}

            {/* Confirmar asistencia — cuando ya paso la hora de la cita */}
            {necesitaAsistencia && !asistenciaEnviada && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">¿Asististe?</span>
                <Button
                  size="sm"
                  onClick={() => confirmarAsistencia(true)}
                  disabled={confirmandoAsistencia}
                  className="h-8 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  Sí asistí
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmarAsistencia(false)}
                  disabled={confirmandoAsistencia}
                  className="h-8 gap-1.5 text-xs border-border/70 bg-card text-foreground hover:bg-muted/40"
                >
                  No asistí
                </Button>
              </div>
            )}
            {necesitaAsistencia && asistenciaEnviada && (
              <span className="text-xs text-muted-foreground">¡Gracias! Actualizando...</span>
            )}

            {/* Botones de accion (solo citas activas y antes de su hora) */}
            {esActiva && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReagendar(cita)}
                  className="h-8 gap-1.5 text-xs border-border/70 bg-card text-foreground hover:bg-muted/40"
                >
                  <EditIcon />
                  Reagendar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancelar(cita)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <TrashIcon />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </article>

      {/* Modal resena */}
      {modalResenaAbierto && clienteId && (
        <ModalResena
          cita={cita}
          clienteId={clienteId}
          onClose={() => setModalResenaAbierto(false)}
          onSuccess={handleResenaExitosa}
        />
      )}
    </>
  )
}
