import { createClient } from '@/lib/supabase/server'
import type { Cita, Cliente } from '@/types'
import { logger } from '@/lib/logger'
import type { ClienteConFrecuencia, ClientesConFrecuenciaResult } from '@/services/clientes'

// ============================================================
// src/services/clientes-ssr.ts
// Variantes server-side de getClientesConFrecuencia y
// buscarClientes, para usar desde Server Components.
//
// CORRECCION: src/app/admin/clientes/page.tsx (Server Component)
// llamaba a estas dos funciones desde services/clientes.ts, que
// usa el cliente de navegador (createBrowserClient). Ese cliente
// no tiene acceso a las cookies de la peticion cuando se invoca
// desde un Server Component, asi que auth.uid() no resuelve al
// usuario logueado y el RPC get_clientes_con_frecuencia()
// (que valida rol = 'administrador') fallaba con "No autorizado"
// incluso para la administradora real. Mismo problema que ya se
// habia corregido para notificaciones-admin-ssr.ts.
//
// Este archivo usa el cliente de servidor (createServerClient,
// con acceso a cookies via next/headers) para que la sesion se
// resuelva correctamente. services/clientes.ts se deja intacto
// para los Client Components que siguen usando el resto de sus
// funciones (FichaClienteShell, formularios, etc.).
// ============================================================

export async function getClientesConFrecuencia(
  pagina = 1,
  porPagina = 50
): Promise<ClientesConFrecuenciaResult> {
  const supabase = await createClient()
  const offset = Math.max(0, (pagina - 1) * porPagina)

  const { data, error } = await supabase.rpc('get_clientes_con_frecuencia', {
    p_limit: porPagina,
    p_offset: offset,
  })

  if (error) {
    logger.error('Error al obtener clientes con frecuencia:', error.message)
    return { clientes: [], total: 0 }
  }

  const filas = (data ?? []) as (ClienteConFrecuencia & { total_count: number })[]
  const total = filas[0]?.total_count ?? 0

  return {
    clientes: filas.map(({ total_count: _totalCount, ...cliente }) => cliente),
    total,
  }
}

export async function buscarClientes(query: string): Promise<ClienteConFrecuencia[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select(`
      *,
      citas(id, estado, fecha)
    `)
    .or(`nombre.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
    .order('nombre', { ascending: true })
    .limit(40)

  if (error) {
    logger.error('Error al buscar clientes:', error.message)
    return []
  }

  const hoy = new Date()
  const limite60 = new Date(hoy)
  limite60.setDate(hoy.getDate() - 60)

  return (data as (Cliente & { citas: { id: string; estado: string; fecha: string }[] })[]).map((c) => {
    const completadas = c.citas.filter((ct) => ct.estado === 'completada')
    const ultimaCompletada = completadas
      .map((ct) => new Date(ct.fecha))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    const inactivo = !ultimaCompletada || ultimaCompletada < limite60

    return {
      ...c,
      total_citas: completadas.length,
      es_frecuente: completadas.length >= 3,
      inactivo,
    }
  })
}

// ------------------------------------------------------------
// CORRECCION (jul 2026): "Ver ficha" en /admin/clientes llevaba a
// la pagina de error/not-found. src/app/admin/clientes/[id]/page.tsx
// es un Server Component y llamaba a getClienteById/getHistorialCliente
// desde services/clientes.ts (cliente de navegador, sin cookies de
// sesion en el servidor) -> RLS bloqueaba la consulta -> null ->
// notFound(). Se agregan aqui las mismas funciones usando el cliente
// de servidor, mismo patron que el resto de este archivo.
// ------------------------------------------------------------

export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    logger.error('Error al obtener cliente:', error.message)
    return null
  }

  return data as Cliente | null
}

// Historial completo de citas de un cliente con servicios y pagos.
export async function getHistorialCliente(clienteId: string): Promise<Cita[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('citas')
    .select(`
      *,
      cita_servicios(servicio:servicios(*)),
      estilos_referencia(*)
    `)
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })

  if (error) {
    logger.error('Error al obtener historial del cliente:', error.message)
    return []
  }

  return data as unknown as Cita[]
}