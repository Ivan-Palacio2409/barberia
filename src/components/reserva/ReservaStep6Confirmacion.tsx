'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReserva } from '@/hooks/useReserva'
import { formatFechaLarga } from '@/lib/disponibilidad-utils'
import { crearCitaCompleta } from '@/app/actions/citas'
import type { ImagenInput } from '@/app/actions/citas'

interface Props {
  onBack: () => void
}

// ── Helpers de formato ────────────────────────────────────────
function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

// ── Iconos SVG ────────────────────────────────────────────────
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconScissors() {
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

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ── Fila de resumen ───────────────────────────────────────────
function FilaResumen({ icono, label, valor }: { icono: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid rgba(245, 245, 245,0.12)' }}>
      <span className="mt-0.5 shrink-0" style={{ color: 'var(--pub-gold)' }}>
        {icono}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--pub-text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--pub-text)' }}>
          {valor}
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export function ReservaStep6Confirmacion({ onBack }: Props) {
  const router = useRouter()
  const {
    serviciosSeleccionados,
    fechaSeleccionada,
    horaInicio,
    horaFin,
    datosCliente,
    notasAdicionales,
    fotosReferencia,
    consentimientoFotos,
    precioTotal,
    duracionTotal,
    reset,
  } = useReserva()

  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const total = precioTotal()
  const duracion = duracionTotal()

  async function handleConfirmar() {
    if (!datosCliente || !fechaSeleccionada || !horaInicio || !horaFin) return

    setEnviando(true)
    setErrorMsg(null)

    try {
      // Convertir File[] a ImagenInput[] (base64) para el server action
      const imagenesInput: ImagenInput[] = []
      if (consentimientoFotos && fotosReferencia.length > 0) {
        for (const file of fotosReferencia) {
          const base64 = await fileToBase64(file)
          imagenesInput.push({
            nombre: file.name,
            tipo: file.type,
            base64,
            tamano: file.size,
          })
        }
      }

      const resultado = await crearCitaCompleta({
        clienteId: datosCliente.clienteId!,
        authUserId: datosCliente.authUserId,
        fecha: fechaSeleccionada,
        horaInicio,
        horaFin,
        serviciosIds: serviciosSeleccionados.map((s) => s.servicio.id),
        precioTotal: total,
        notas: notasAdicionales || undefined,
        imagenes: imagenesInput,
        consentimientoFotos,
      })

      if (!resultado.ok) {
        if (resultado.code === 'SLOT_OCUPADO') {
          setErrorMsg(resultado.error ?? 'El horario ya no está disponible.')
        } else {
          setErrorMsg(resultado.error ?? 'Error al crear la cita. Intenta de nuevo.')
        }
        return
      }

      // Limpiar el estado de reserva y redirigir
      reset()
      router.push(`/reserva-confirmada/${resultado.citaId}`)
    } catch {
      setErrorMsg('Error inesperado. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (!datosCliente || !fechaSeleccionada || !horaInicio || !horaFin) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
          Faltan datos de la reserva. Vuelve al inicio.
        </p>
        <button type="button" onClick={onBack} className="text-sm underline" style={{ color: 'var(--pub-gold)' }}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2
          className="font-display text-2xl font-semibold mb-1"
          style={{ color: 'var(--pub-text)' }}
        >
          Confirma tu reserva
        </h2>
        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
          Revisa los detalles antes de confirmar.
        </p>
      </div>

      {/* Tarjeta resumen */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(245, 245, 245,0.2)' }}
      >
        {/* Header de la tarjeta */}
        <div
          className="px-5 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 245, 245,0.12) 0%, rgba(245, 245, 245,0.06) 100%)',
            borderBottom: '1px solid rgba(245, 245, 245,0.15)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--pub-gold)' }}
          >
            Resumen de tu cita
          </p>
        </div>

        <div className="px-5">
          <FilaResumen
            icono={<IconCalendar />}
            label="Fecha"
            valor={formatFechaLarga(fechaSeleccionada)}
          />
          <FilaResumen
            icono={<IconClock />}
            label="Horario"
            valor={`${horaInicio} — ${horaFin} (${duracion} min)`}
          />
          <FilaResumen
            icono={<IconUser />}
            label="Cliente"
            valor={`${datosCliente.nombre} · ${datosCliente.telefono}`}
          />

          {/* Servicios */}
          <div className="py-3" style={{ borderBottom: '1px solid rgba(245, 245, 245,0.12)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span style={{ color: 'var(--pub-gold)' }}>
                <IconScissors />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--pub-text-muted)' }}>
                Servicios
              </p>
            </div>
            <ul className="space-y-1 ml-7">
              {serviciosSeleccionados.map(({ servicio }) => (
                <li key={servicio.id} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--pub-text)' }}>{servicio.nombre}</span>
                  <span className="font-medium" style={{ color: 'var(--pub-gold)' }}>
                    {formatCOP(servicio.precio)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notas */}
          {notasAdicionales && (
            <div className="py-3" style={{ borderBottom: '1px solid rgba(245, 245, 245,0.12)' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--pub-text-muted)' }}>
                Notas
              </p>
              <p className="text-sm ml-7" style={{ color: 'var(--pub-text)' }}>
                {notasAdicionales}
              </p>
            </div>
          )}

          {/* Fotos */}
          {fotosReferencia.length > 0 && (
            <div className="py-3" style={{ borderBottom: '1px solid rgba(245, 245, 245,0.12)' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--pub-text-muted)' }}>
                Fotos de referencia
              </p>
              <p className="text-sm ml-7" style={{ color: 'var(--pub-text)' }}>
                {fotosReferencia.length} imagen{fotosReferencia.length > 1 ? 'es' : ''} adjunta{fotosReferencia.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="py-4 flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: 'var(--pub-text)' }}>
              Total estimado
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--pub-gold)' }}>
              {formatCOP(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Aviso de pago */}
      <p className="text-xs text-center" style={{ color: 'var(--pub-text-muted)' }}>
        El pago se realiza en el local el dia de la cita. Te contactaremos para confirmar.
      </p>

      {/* Error */}
      {errorMsg && (
        <div
          className="rounded-xl p-4 flex items-start gap-2 text-sm"
          style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <IconAlert />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={enviando}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border transition-all duration-200 disabled:opacity-50"
          style={{ borderColor: 'rgba(245, 245, 245,0.3)', color: 'var(--pub-text-muted)' }}
        >
          <IconArrowLeft />
          Atras
        </button>

        <button
          type="button"
          onClick={handleConfirmar}
          disabled={enviando}
          className="flex-1 sm:flex-none sm:ml-auto px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: enviando
              ? 'rgba(245, 245, 245,0.2)'
              : 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
            color: enviando ? 'var(--pub-text-muted)' : 'white',
            boxShadow: enviando ? 'none' : '0 2px 14px rgba(245, 245, 245,0.35)',
          }}
        >
          {enviando ? 'Creando tu cita...' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  )
}

// ── Helper: File → base64 ─────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Quitar el prefijo "data:image/jpeg;base64,"
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
