import Link from 'next/link'
import { BusinessMap } from '@/components/maps/BusinessMap'
import { ROUTES } from '@/constants'
import { FloatingBarberTools } from '@/components/decor/FloatingBarberTools'

const HORARIOS = [
  { dia: 'Lunes a viernes', hora: '8:00 am – 6:00 pm' },
  { dia: 'Sábados', hora: '8:00 am – 4:00 pm' },
  { dia: 'Domingos', hora: 'Cerrado' },
]

export function ContactSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28" style={{ background: 'var(--pub-bg-soft)' }} aria-labelledby="contacto-titulo">
      <FloatingBarberTools compact className="opacity-70" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-14 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--pub-gold)' }}>
            Encuéntranos
          </p>
          <h2 id="contacto-titulo" className="font-display text-4xl lg:text-5xl font-semibold" style={{ color: 'var(--pub-text)' }}>
            Visítanos
          </h2>
          <p className="text-base" style={{ color: 'var(--pub-text-muted)' }}>
            Estamos ubicados en un lugar fácil de encontrar. ¡Te esperamos!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-7">
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ border: '1px solid var(--pub-border)', color: 'var(--pub-gold)' }}>

                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--pub-text)' }}>Dirección</h3>
                <p style={{ color: 'var(--pub-text-muted)' }} className="text-sm leading-relaxed">
                  Calle 123 # 45-67, Bogotá D.C.<br />Colombia
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ border: '1px solid var(--pub-border)', color: 'var(--pub-gold)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 1.18H6.4a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--pub-text)' }}>Teléfono</h3>
                <a href="tel:+573001234567" className="text-sm hover:underline underline-offset-2" style={{ color: 'var(--pub-text-muted)' }}>
                  +57 300 123 4567
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ border: '1px solid var(--pub-border)', color: 'var(--pub-gold)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-2.5" style={{ color: 'var(--pub-text)' }}>Horarios de atención</h3>
                <dl className="space-y-1.5">
                  {HORARIOS.map((h) => (
                    <div key={h.dia} className="flex justify-between gap-4">
                      <dt className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>{h.dia}</dt>
                      <dd className="text-sm font-medium text-right" style={{ color: h.hora === 'Cerrado' ? 'var(--pub-text-dim)' : 'var(--pub-text)' }}>
                        {h.hora}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#25D366' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Escribir por WhatsApp
              </a>
              <Link
                href={ROUTES.reservar}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border transition-colors hover:bg-white/[0.04]"
                style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text)' }}
              >
                Reservar cita online
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--pub-text-dim)' }}>Síguenos</span>
              {[
                { label: 'Instagram', href: '#', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                )},
                { label: 'TikTok', href: '#', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                )},
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="tap-target rounded-lg border transition-colors hover:border-[var(--pub-gold)] hover:text-[var(--pub-gold)]"
                  style={{ borderColor: 'var(--pub-border)', color: 'var(--pub-text-muted)' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden pub-card" style={{ minHeight: 380 }}>
            <BusinessMap />
          </div>
        </div>
      </div>
    </section>
  )
}
