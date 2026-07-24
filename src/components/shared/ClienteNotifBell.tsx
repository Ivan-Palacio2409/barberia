'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ============================================================
// ClienteNotifBell.tsx — Fase 24, reescrito jul 2026
// Campana de notificaciones para el cliente autenticado.
// Consulta la tabla notificaciones filtrando por su cliente_id.
// Muestra un dropdown con las ultimas 5 y un badge de no leidas.
//
// QA jul 2026: el estado "leida" vivia solo en un useState local
// (const [leidas, setLeidas] = useState<Set<string>>()) — se
// perdia por completo al recargar la pagina, cerrar sesion, o
// volver a entrar, y la campana volvia a mostrar todo como "no
// leido" cada vez. Ahora se persiste en la base de datos (columna
// notificaciones.leida, migracion 042): al abrir la campana se
// marcan como leidas ahi mismo, y el contador solo vuelve a subir
// cuando llega una notificacion realmente nueva.
// ============================================================

interface NotifItem {
  id: string
  tipo: string
  fecha_programada: string
  enviado: boolean
  leida: boolean
}

const TIPOS_LABEL: Record<string, string> = {
  confirmacion_cita:       'Tu cita fue confirmada',
  recordatorio_24_horas:   'Recordatorio: cita manana',
  reagendamiento_cita:     'Cita reagendada',
  cancelacion_cita:        'Cita cancelada',
  solicitud_resena:        'Deja tu resena',
  aviso_lista_espera:      'Hay disponibilidad para ti',
}

// Tipos que ya no se generan (no habia cron que los procesara y
// quedaban "pendientes"/"vencidos" para siempre); se excluyen tambien
// por si quedan filas viejas en la base de datos.
const TIPOS_EXCLUIDOS = ['recordatorio_mismo_dia', 'recordatorio_1_hora']

function formatRelativo(s: string) {
  const diff = Date.now() - new Date(s).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  if (h < 24) return `Hace ${h}h`
  return `Hace ${d}d`
}

interface ClienteNotifBellProps {
  clienteId: string
}

export function ClienteNotifBell({ clienteId }: ClienteNotifBellProps) {
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('notificaciones')
      .select('id, tipo, fecha_programada, enviado, leida')
      .eq('cliente_id', clienteId)
      .eq('destinatario', 'cliente')
      .not('tipo', 'in', `(${TIPOS_EXCLUIDOS.join(',')})`)
      .order('fecha_programada', { ascending: false })
      .limit(10)

    setNotifs((data ?? []) as NotifItem[])
  }, [clienteId])

  useEffect(() => {
    cargar()

    // Suscripcion Realtime para nuevas notificaciones
    const supabase = createClient()
    const channel = supabase
      .channel(`cliente-notifs-${clienteId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `cliente_id=eq.${clienteId}` },
        () => cargar()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clienteId, cargar])

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const noLeidas = notifs.filter(n => !n.leida).length

  async function handleAbrir() {
    const nuevoEstado = !open
    setOpen(nuevoEstado)
    if (nuevoEstado && noLeidas > 0) {
      // Optimista en la UI, y se persiste en la base de datos para
      // que sobreviva recargas y cierres de sesion.
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
      const supabase = createClient()
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('cliente_id', clienteId)
        .eq('destinatario', 'cliente')
        .eq('leida', false)
      if (error) {
        // Si falla la persistencia, se recarga para reflejar el
        // estado real en vez de quedar desincronizado.
        cargar()
      }
    }
  }

  const recientes = notifs.slice(0, 5)

  return (
    <div ref={panelRef} className="relative">
      {/* Boton campana */}
      <button
        onClick={handleAbrir}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
        style={{ color: 'var(--pub-text-muted)' }}
        aria-label={noLeidas > 0 ? `${noLeidas} notificaciones nuevas` : 'Notificaciones'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[var(--pub-on-gold)] text-[10px] font-bold flex items-center justify-center leading-none"
            style={{ background: 'var(--pub-gold)' }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl border border-[var(--pub-gold)]/20 bg-[var(--pub-surface)] shadow-lg z-50 overflow-hidden">
          {/* Cabecera */}
          <div className="px-4 py-3 border-b border-[var(--pub-gold)]/10 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--pub-text)' }}>Notificaciones</p>
            {notifs.length > 5 && (
              <Link
                href="/cliente/perfil"
                onClick={() => setOpen(false)}
                className="text-xs font-medium"
                style={{ color: 'var(--pub-gold)' }}
              >
                Ver todas
              </Link>
            )}
          </div>

          {/* Lista */}
          {recientes.length === 0 ? (
            <div className="py-10 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2" style={{ color: 'var(--pub-gold)' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>Sin notificaciones aun</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--pub-gold)]/10 max-h-80 overflow-y-auto">
              {recientes.map(n => (
                <li
                  key={n.id}
                  className={cn(
                    'px-4 py-3 flex items-start gap-3',
                    !n.leida && 'bg-[var(--pub-bg)]'
                  )}
                >
                  {/* Icono */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: '#FDF0F0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pub-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: 'var(--pub-text)' }}>
                      {TIPOS_LABEL[n.tipo] ?? n.tipo}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pub-text-muted)' }}>
                      {formatRelativo(n.fecha_programada)}
                    </p>
                  </div>
                  {/* Punto no leida */}
                  {!n.leida && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--pub-gold)' }} />
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[var(--pub-gold)]/10">
            <Link
              href="/cliente/mis-citas"
              onClick={() => setOpen(false)}
              className="text-xs font-medium"
              style={{ color: 'var(--pub-gold)' }}
            >
              Ver mis citas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}