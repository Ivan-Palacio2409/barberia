import type { Metadata } from 'next'
import { headers } from 'next/headers'
import {
  HeroSectionDesktop,
  HeroSectionMobile,
  ServicesSection,
  GalleryPreview,
  ReviewsCarousel,
  ContactSection,
} from '@/components/public'
import {
  getServiciosPorCategoriaHome,
  getEstilosDestacadosHome,
  getResenasDestacadasHome,
  getPromedioHome,
} from '@/services/home'

// ============================================================
// Metadata SEO
// ============================================================
export const metadata: Metadata = {
  title: 'BARBERÍA — Peluquería',
  description:
    'Peluquería especializada en cortes, barba, color y tratamientos capilares. Reserva tu cita online de forma fácil y rápida.',
  openGraph: {
    title: 'BARBERÍA — Peluquería',
    description:
      'Peluquería especializada en cortes, barba, color y tratamientos capilares.',
    type: 'website',
  },
}

// ============================================================
// Schema.org — BeautySalon (JSON-LD)
// ============================================================
async function SchemaSalon() {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: 'BARBERÍA',
    description:
      'Peluquería especializada en cortes, barba, color y tratamientos capilares.',
    telephone: '+573001234567',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle 123 # 45-67',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '16:00',
      },
    ],
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberia-peluqueria.vercel.app',
    priceRange: '$$',
    currenciesAccepted: 'COP',
    paymentAccepted: 'Cash, Credit Card, Transfer',
  }

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// Página — se renderiza en el servidor (RSC)
// ============================================================
export default async function HomePage() {
  // Peticiones en paralelo
  const [categorias, estilos, resenas, promedio] = await Promise.all([
    getServiciosPorCategoriaHome(),
    getEstilosDestacadosHome(8),
    getResenasDestacadasHome(5),
    getPromedioHome(),
  ])

  return (
    <>
      <SchemaSalon />

      <main>
        {/* 1. Hero */}
<HeroSectionDesktop />
<HeroSectionMobile />

        {/* 2. Servicios por categoría */}
        <ServicesSection categorias={categorias} />

        {/* 3. Galería destacada */}
        {estilos.length > 0 && <GalleryPreview estilos={estilos} />}

        {/* 4. Reseñas */}
        {resenas.length > 0 && (
          <>
            <ReviewsCarousel resenas={resenas} promedio={promedio} />
            <div className="text-center -mt-10 mb-16">
              <a
                href="/resenas"
                className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
                style={{ color: 'var(--pub-gold)' }}
              >
                Ver todas las reseñas
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </>
        )}

        {/* 5. Contacto + mapa */}
        <ContactSection />
      </main>
    </>
  )
}
