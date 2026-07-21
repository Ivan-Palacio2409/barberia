import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getListaEsperaByCliente } from '@/services/lista-espera'
import { ListaEsperaClientSection } from '@/components/lista-espera/ListaEsperaClientSection'
import type { Cliente } from '@/types'

export const metadata: Metadata = {
  title: 'Lista de espera | BARBERÍA',
  description:
    'No hay disponibilidad en la fecha que quieres? Inscríbete en la lista de espera y te avisamos cuando se libere un cupo.',
}

// No cachear: el estado de inscripciones es personal
export const dynamic = 'force-dynamic'

async function getContexto(): Promise<{
  cliente: Cliente | null
  inscripciones: import('@/types').ListaEspera[]
  serviciosOpciones: string[]
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Servicios activos como opciones de filtro
  const { data: servicios } = await supabase
    .from('servicios')
    .select('nombre')
    .eq('activo', true)
    .order('nombre')

  const serviciosOpciones = servicios?.map((s) => s.nombre) ?? []

  if (!user) {
    return { cliente: null, inscripciones: [], serviciosOpciones }
  }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!cliente) {
    return { cliente: null, inscripciones: [], serviciosOpciones }
  }

  const inscripciones = await getListaEsperaByCliente(cliente.id)

  return { cliente: cliente as Cliente, inscripciones, serviciosOpciones }
}

export default async function ListaEsperaPage() {
  const { cliente, inscripciones, serviciosOpciones } = await getContexto()

  return (
    <main className="min-h-screen bg-[var(--pub-bg)]">
      {/* Hero */}
      <section
        className="pt-28 pb-14 px-4 text-center"
        style={{ background: 'linear-gradient(180deg, var(--pub-surface) 0%, var(--pub-bg) 100%)' }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--pub-gold)] mb-3">
          Sin disponibilidad
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--pub-text)] leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Lista de{' '}
          <span className="italic text-[var(--pub-gold)]">espera</span>
        </h1>
        <p className="text-[var(--pub-text-muted)] max-w-md mx-auto text-sm leading-relaxed">
          Si la fecha que deseas no tiene cupos disponibles, déjanos tus datos y te avisamos
          de inmediato si se libera un espacio.
        </p>
      </section>

      {/* Contenido */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <ListaEsperaClientSection
          cliente={cliente}
          inscripciones={inscripciones}
          serviciosOpciones={serviciosOpciones}
        />
      </section>
    </main>
  )
}
