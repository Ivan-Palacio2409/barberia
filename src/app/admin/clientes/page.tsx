// ============================================================
// src/app/admin/clientes/page.tsx — Fase 19
// Lista de clientes con buscador, frecuencia de visitas y
// etiquetas de cliente frecuente / inactivo.
// Server Component con búsqueda y paginación via searchParams.
//
// Auditoría fase 30 (H2): la búsqueda (buscarClientes) sigue
// devolviendo hasta 40 resultados sin paginar (volumen bajo por
// naturaleza de una búsqueda). El listado completo sí pagina de
// verdad ahora, apoyado en la función SQL get_clientes_con_frecuencia.
// ============================================================

import { getClientesConFrecuencia, buscarClientes } from '@/services/clientes-ssr'
import { ClientesLista } from '@/components/admin/clientes/ClientesLista'

export const metadata = {
  title: 'Clientes | Admin BARBERÍA',
}

const POR_PAGINA = 50

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function ClientesPage({ searchParams }: Props) {
  const sp = await searchParams
  const query = sp.q?.trim() ?? ''
  const pagina = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)

  const clientes = query
    ? await buscarClientes(query)
    : null
  const resultado = query ? null : await getClientesConFrecuencia(pagina, POR_PAGINA)

  const listaClientes = query ? (clientes ?? []) : resultado!.clientes
  const total = query ? listaClientes.length : resultado!.total

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {query
            ? `${total} cliente${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`
            : `Mostrando ${listaClientes.length} de ${total} cliente${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      <ClientesLista
        clientes={listaClientes}
        queryInicial={query}
        pagina={pagina}
        porPagina={POR_PAGINA}
        total={total}
      />
    </div>
  )
}