// ============================================================
// lib/analytics/index.ts — Fase 27 [C4]
// Tracking de eventos de negocio.
// Soporte para PostHog, Plausible y GA4.
// ============================================================

import type { Cita } from '@/types'

// ── Dispatcher genérico ───────────────────────────────────────
function track(event: string, properties?: Record<string, unknown>) {
  // PostHog
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).posthog) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).posthog.capture(event, properties)
  }

  // GA4
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).gtag) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gtag('event', event, properties)
  }

  // Plausible
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).plausible) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).plausible(event, { props: properties })
  }
}

// ── Eventos de negocio ────────────────────────────────────────
export const trackEvent = {
  // Embudo de reserva
  reservaIniciada:   (servicios: string[]) =>
    track('reserva_iniciada', { servicios }),
  reservaPaso:       (paso: number) =>
    track('reserva_paso', { paso }),
  reservaAbandonada: (paso: number) =>
    track('reserva_abandonada', { paso }),
  reservaCompletada: (cita: Cita) =>
    track('reserva_completada', { cita_id: cita.id, precio: cita.precio_total }),

  // Catálogo
  servicioVisto:     (servicioId: string) =>
    track('servicio_visto', { servicio_id: servicioId }),
  disenioVisto:      (disenioId: string) =>
    track('disenio_visto', { disenio_id: disenioId }),

  // Pagos
  pagoIniciado:      (monto: number) =>
    track('pago_iniciado', { monto }),
  pagoCompletado:    (monto: number, metodo: string) =>
    track('pago_completado', { monto, metodo }),

  // Usuarios
  usuarioRegistrado: () =>
    track('usuario_registrado'),
  loginRealizado:    (metodo: 'email' | 'google') =>
    track('login_realizado', { metodo }),

  // Reseñas
  resenaEnviada:     (puntuacion: number) =>
    track('resena_enviada', { puntuacion }),
}
