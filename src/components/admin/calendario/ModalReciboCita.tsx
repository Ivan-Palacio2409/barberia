'use client'

import { useRouter } from 'next/navigation'
import type { CitaCalendario } from '@/types'
import { formatFechaLarga } from '@/lib/disponibilidad-utils'

// ============================================================
// ModalReciboCita.tsx
// Recibo rápido de una cita: se abre al hacer clic en un bloque
// del calendario (CitaBloque), sin necesidad de navegar a la
// página completa de la cita. Todos los datos ya vienen en el
// objeto `cita` que usa el propio calendario, así que no hace
// falta una petición adicional al servidor.
// ============================================================

interface Props {
  cita: CitaCalendario
  onClose: () => void
}

function formatPrecio(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

function duracionMinutos(inicio: string, fin: string): number {
  const [h1, m1] = inicio.slice(0, 5).split(':').map(Number)
  const [h2, m2] = fin.slice(0, 5).split(':').map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

export function ModalReciboCita({ cita, onClose }: Props) {
  const router = useRouter()
  const duracion = duracionMinutos(cita.hora_inicio, cita.hora_fin)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-foreground">Detalle de la cita</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-border">
          <Fila icon={<IconCalendario />} label="FECHA">
            {formatFechaLarga(cita.fecha)}
          </Fila>

          <Fila icon={<IconReloj />} label="HORARIO">
            {cita.hora_inicio.slice(0, 5)} — {cita.hora_fin.slice(0, 5)} ({duracion} min)
          </Fila>

          <Fila icon={<IconPersona />} label="CLIENTE">
            {cita.cliente.nombre} · {cita.cliente.telefono}
          </Fila>

          <div className="py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              <IconTijeras />
              Servicios
            </div>
            <div className="space-y-1">
              {cita.servicios.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm text-foreground">
                  <span>{s.nombre}</span>
                  <span>{formatPrecio(s.precio)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium text-foreground">Total estimado</span>
          <span className="text-lg font-display font-semibold text-primary">
            {formatPrecio(cita.precio_total)}
          </span>
        </div>

        {cita.notas && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            <span className="font-medium">Notas: </span>
            {cita.notas}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Fila con icono ──────────────────────────────────────────
function Fila({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0">
      <span className="text-primary mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{children}</p>
      </div>
    </div>
  )
}

// ── Iconos ────────────────────────────────────────────────────
function IconCalendario() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconReloj() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconPersona() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconTijeras() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}