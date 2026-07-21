import type { Metadata } from 'next'
import { ServiceTabs } from '@/components/servicios/ServiceTabs'
import { getServiciosPorCategoria } from '@/services/servicios-ssr'

export const metadata: Metadata = {
  title: 'Servicios — BARBERÍA',
  description:
    'Descubre todos nuestros servicios de peluquería: cortes, barba, color y tratamientos capilares. Precios, duraciones y descripción de cada servicio.',
  openGraph: {
    title: 'Servicios — BARBERÍA',
    description: 'Cortes, barba, color y tratamientos capilares. Reserva tu cita online.',
  },
}

export default async function ServiciosPage() {
  const categorias = await getServiciosPorCategoria()

  return (
    <main className="pt-24 pb-20 lg:pt-28 lg:pb-28">
      {/* Hero sección */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-14">
        <div className="max-w-2xl">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--pub-gold)' }}
          >
            Lo que hacemos
          </p>
          <h1
            className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-4"
            style={{ color: 'var(--pub-text)' }}
          >
            Nuestros servicios
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--pub-text-muted)' }}>
            Desde el corte clásico hasta los estilos más exigentes. Cada servicio con el cuidado
            y la dedicación que mereces.
          </p>
        </div>
      </div>

      {/* Tabs por categoría */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ServiceTabs categorias={categorias} />
      </div>
    </main>
  )
}
