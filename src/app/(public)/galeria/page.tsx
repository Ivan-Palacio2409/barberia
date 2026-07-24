import type { Metadata } from 'next'
import { GalleryGrid } from '@/components/galeria/GalleryGrid'
import { getCatalogoConCategorias } from '@/services/galeria'

export const metadata: Metadata = {
  title: 'Galería — BARBERÍA',
  description:
    'Inspírate con nuestra galería de cortes y estilos. Fotos reales de trabajos realizados en BARBERÍA.',
  openGraph: {
    title: 'Galería — BARBERÍA',
    description: 'Galería de cortes y estilos reales.',
  },
}

// ISR: revalida cada 60 s para mostrar estilos nuevos rápido
export const revalidate = 60

export default async function GaleriaPage() {
  const { estilos } = await getCatalogoConCategorias()

  return (
    <main className="pt-24 pb-20 lg:pt-28 lg:pb-28">
      {/* Hero sección */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-2xl">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--pub-gold)' }}
          >
            Inspiración
          </p>
          <h1
            className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-4"
            style={{ color: 'var(--pub-text)' }}
          >
            Galería
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--pub-text-muted)' }}>
            Cada estilo cuenta una historia. Aquí encontrarás el trabajo real que hacemos cada día
            para nuestros clientes.
          </p>
        </div>
      </div>

      {/* Grid con filtros */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <GalleryGrid estilos={estilos} />
      </div>
    </main>
  )
}