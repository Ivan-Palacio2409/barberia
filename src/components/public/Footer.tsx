import Link from 'next/link'
import { ROUTES } from '@/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const socialLinks = [
    { label: 'Instagram', href: '#', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    )},
    { label: 'WhatsApp', href: '#', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )},
    { label: 'TikTok', href: '#', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    )},
  ]

  return (
    <footer style={{ background: 'var(--pub-surface)', borderTop: '1px solid var(--pub-border)' }}>
      <div className="h-px pub-barberpole" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="16" cy="16" r="14.5" stroke="var(--pub-gold)" strokeWidth="1.3" />
                <circle cx="11.5" cy="21.5" r="2" stroke="var(--pub-gold)" strokeWidth="1.3" />
                <circle cx="20.5" cy="21.5" r="2" stroke="var(--pub-gold)" strokeWidth="1.3" />
                <path d="M13 20 L22 9.5 M19 20 L10 9.5" stroke="var(--pub-gold)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="font-display text-base font-semibold" style={{ color: 'var(--pub-text)' }}>BARBERÍA</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--pub-text-muted)' }}>
              Tu peluquería de confianza. Cortes y barba.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="tap-target transition-colors hover:text-[var(--pub-gold)]"
                  style={{ color: 'var(--pub-text-dim)' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--pub-text-dim)' }}>Explorar</h3>
            <nav className="flex flex-col gap-2.5" aria-label="Pie de página">
              {[
                { href: ROUTES.servicios, label: 'Servicios' },
                { href: ROUTES.galeria, label: 'Galería' },
                { href: ROUTES.resenas, label: 'Reseñas' },
                { href: ROUTES.listaEspera, label: 'Lista de espera' },
                { href: ROUTES.reservar, label: 'Reservar cita' },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="text-sm transition-colors hover:text-[var(--pub-text)]" style={{ color: 'var(--pub-text-muted)' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--pub-text-dim)' }}>Legal</h3>
            <nav className="flex flex-col gap-2.5" aria-label="Legal">
              <Link href={ROUTES.privacidad} className="text-sm transition-colors hover:text-[var(--pub-text)]" style={{ color: 'var(--pub-text-muted)' }}>
                Política de Privacidad
              </Link>
              <Link href={ROUTES.terminos} className="text-sm transition-colors hover:text-[var(--pub-text)]" style={{ color: 'var(--pub-text-muted)' }}>
                Términos y Condiciones
              </Link>
            </nav>
          </div>
        </div>

        <hr className="mt-10" style={{ borderColor: 'var(--pub-border)' }} />

        <p className="mt-6 text-xs text-center" style={{ color: 'var(--pub-text-dim)' }}>
          © {year} BARBERÍA. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
