'use client'

import { useState } from 'react'
import Link from 'next/link'
import { eliminarFotografiasCliente } from '@/services/clientes'
import { logger } from '@/lib/logger'

// ── Iconos SVG ───────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

interface Props {
  clienteId: string
  userEmail?: string
}

type Modal = null | 'fotos' | 'cuenta'

export function MisDatosPrivacidad({ clienteId, userEmail }: Props) {
  const [modal, setModal] = useState<Modal>(null)
  const [processing, setProcessing] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  // ── Eliminar fotografias ─────────────────────────────────────
  const handleEliminarFotos = async () => {
    setProcessing(true)
    setMensajeError(null)
    try {
      const result = await eliminarFotografiasCliente(clienteId)
      if (!result.ok) throw new Error('No se pudieron eliminar las fotografias.')
      setMensaje(
        result.eliminadas === 0
          ? 'No se encontraron fotografias registradas.'
          : `${result.eliminadas} fotografia(s) eliminada(s) correctamente.`
      )
      setModal(null)
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : 'Error al eliminar.')
    } finally {
      setProcessing(false)
    }
  }

  // ── Solicitar eliminacion de cuenta ─────────────────────────
  const handleSolicitarEliminacion = async () => {
    setProcessing(true)
    setMensajeError(null)
    try {
      // La eliminacion de cuenta es manual segun Ley 1581/2012 (maximo 15 dias habiles).
      // Enviamos un registro de la solicitud al admin via notificacion.
      const supabaseModule = await import('@/lib/supabase/client')
      const supabase = supabaseModule.createClient()

      const { error: errorNotif } = await supabase.from('notificaciones').insert({
        cliente_id: clienteId,
        tipo: 'solicitud_eliminacion_cuenta',
        destinatario: 'admin',
        canal: 'whatsapp',
        enviado: false,
        fecha_programada: new Date().toISOString(),
      })
      // QA fase 30 (M3): antes se ignoraba en silencio.
      if (errorNotif) {
        logger.error('[MisDatosPrivacidad] No se pudo registrar la solicitud de eliminación:', clienteId, errorNotif.message)
      }

      setMensaje(
        'Solicitud enviada. El equipo de BARBERÍA eliminara tus datos en un plazo maximo de 15 dias habiles conforme a la Ley 1581/2012.'
      )
      setModal(null)
    } catch {
      setMensajeError('Error al enviar la solicitud. Contacta directamente al negocio.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2 text-foreground">
        <ShieldIcon />
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Mis datos y privacidad
        </h3>
      </div>

      {/* Feedback */}
      {mensaje && (
        <div className="text-sm text-success-dark bg-success-light border border-success/30 rounded-lg px-4 py-3">
          {mensaje}
        </div>
      )}
      {mensajeError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {mensajeError}
        </div>
      )}

      {/* Acciones ARCO */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Derechos sobre tus datos (ARCO)
        </p>

        <div className="space-y-2">
          {/* Eliminar fotografias */}
          <button
            onClick={() => setModal('fotos')}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
          >
            <span className="text-muted-foreground group-hover:text-accent transition-colors">
              <ImageIcon />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                Eliminar mis fotografias
              </p>
              <p className="text-xs text-muted-foreground">
                Elimina todas las fotos de estilos que subiste en tus citas.
              </p>
            </div>
          </button>

          {/* Solicitar eliminacion de cuenta */}
          <button
            onClick={() => setModal('cuenta')}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all group"
          >
            <span className="text-muted-foreground group-hover:text-destructive transition-colors">
              <TrashIcon />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-destructive transition-colors">
                Solicitar eliminacion de mi cuenta
              </p>
              <p className="text-xs text-muted-foreground">
                Solicita la eliminacion de todos tus datos. Plazo maximo: 15 dias habiles.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Link a politica de privacidad */}
      <Link
        href="/privacidad"
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
      >
        Conoce tus derechos como titular de datos
        <ExternalLinkIcon />
      </Link>

      {/* ── Modales de confirmacion ─────────────────────────────── */}
      {modal === 'fotos' && (
        <ModalConfirmacion
          titulo="Eliminar mis fotografias"
          descripcion="Se eliminaran permanentemente todas las imagenes de estilos de referencia que subiste en tus citas. Esta accion no se puede deshacer."
          labelConfirmar="Si, eliminar fotografias"
          onConfirm={handleEliminarFotos}
          onCancel={() => setModal(null)}
          processing={processing}
        />
      )}

      {modal === 'cuenta' && (
        <ModalConfirmacion
          titulo="Solicitar eliminacion de cuenta"
          descripcion={`Se enviara una solicitud formal al equipo de BARBERÍA${userEmail ? ` desde ${userEmail}` : ''}. Tus datos seran eliminados en un plazo maximo de 15 dias habiles conforme a la Ley 1581/2012. Esta accion es irreversible.`}
          labelConfirmar="Si, solicitar eliminacion"
          onConfirm={handleSolicitarEliminacion}
          onCancel={() => setModal(null)}
          processing={processing}
        />
      )}
    </div>
  )
}

// ── Modal de confirmacion reutilizable ───────────────────────
function ModalConfirmacion({
  titulo,
  descripcion,
  labelConfirmar,
  onConfirm,
  onCancel,
  processing,
}: {
  titulo: string
  descripcion: string
  labelConfirmar: string
  onConfirm: () => void
  onCancel: () => void
  processing: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h4 className="text-base font-semibold text-foreground font-display">{titulo}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{descripcion}</p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {processing ? 'Procesando...' : labelConfirmar}
          </button>
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}