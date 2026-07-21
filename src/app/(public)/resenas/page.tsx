import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getResenasServer, getPromedioCalificacionServer } from '@/services/resenas-ssr'
import { ResenasClientSection } from '@/components/resenas/ResenasClientSection'

export const metadata: Metadata = {
  title: 'Reseñas | BARBERÍA',
  description: 'Lee lo que nuestros clientes opinan sobre sus experiencias en BARBERÍA.',
}

// ISR: revalidar cada 5 minutos
export const revalidate = 300

async function getClienteId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('clientes')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  return data?.id ?? null
}

export default async function ResenasPage() {
  const [resenas, { promedio, total }, clienteId] = await Promise.all([
    getResenasServer(),
    getPromedioCalificacionServer(),
    getClienteId(),
  ])

  return (
    <main className="min-h-screen bg-[var(--pub-bg)]">
      {/* Hero */}
      <section
        className="pt-28 pb-14 px-4 text-center"
        style={{ background: 'linear-gradient(180deg, var(--pub-surface) 0%, var(--pub-bg) 100%)' }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--pub-gold)] mb-3">
          Opiniones
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--pub-text)] leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Lo que dicen{' '}
          <span className="italic text-[var(--pub-gold)]">nuestros clientes</span>
        </h1>
        <p className="text-[var(--pub-text-muted)] max-w-md mx-auto text-sm leading-relaxed">
          Cada reseña es la experiencia real de alguien que confio en nosotros. Gracias por compartirla.
        </p>
      </section>

      {/* Contenido */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--pub-gold)] border-t-transparent animate-spin" />
            </div>
          }
        >
          <ResenasClientSection
            resenasIniciales={resenas}
            promedio={promedio}
            total={total}
            clienteId={clienteId}
          />
        </Suspense>
      </section>
    </main>
  )
}
