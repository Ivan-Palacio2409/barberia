import { createClient } from '@/lib/supabase/client'
import type { Cita, Cliente } from '@/types'
import { logger } from '@/lib/logger'

// ============================================================
// SERVICIO: clientes
// [C2] CRUD del modelo unificado de clientes (invitados y con
// cuenta), más la función de conciliación que evita duplicados
// cuando un invitado crea una cuenta más adelante.
// Fase 19: getClientesConFrecuencia, buscarClientes,
// getHistorialCliente añadidos.
// ============================================================

export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error al obtener el cliente:', error.message)
    return null
  }

  return data as Cliente
}

export async function buscarPorAuthUserId(authUserId: string): Promise<Cliente | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    logger.error('Error al buscar cliente por auth_user_id:', error.message)
    return null
  }

  return data as Cliente | null
}

// QA fase 30: antes hacía un INSERT directo, así que cada reintento
// del paso 4 de la reserva (doble clic, reconexión, volver atrás y
// avanzar de nuevo) creaba un cliente invitado duplicado. Ahora
// delega en buscar_o_crear_cliente_invitado() (migración 033), que
// primero busca por teléfono/email antes de insertar y devuelve la
// fila completa directamente (un invitado sin sesión no tiene
// permiso RLS para hacer SELECT sobre `clientes` en una segunda
// llamada, así que no alcanza con que la función devuelva solo el id).
export async function crearClienteInvitado(
  data: Pick<Cliente, 'nombre' | 'telefono' | 'email'>
): Promise<Cliente | null> {
  const supabase = createClient()

  const { data: filas, error } = await supabase.rpc(
    'buscar_o_crear_cliente_invitado',
    {
      p_nombre: data.nombre,
      p_telefono: data.telefono,
      p_email: data.email || null,
    }
  )

  if (error || !filas || filas.length === 0) {
    logger.error('Error al crear cliente invitado:', error?.message)
    return null
  }

  return filas[0] as Cliente
}

export async function actualizarCliente(
  id: string,
  data: Partial<Pick<Cliente, 'nombre' | 'telefono' | 'email' | 'observaciones'>>
): Promise<Cliente | null> {
  const supabase = createClient()

  const { data: actualizado, error } = await supabase
    .from('clientes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Error al actualizar el cliente:', error.message)
    return null
  }

  return actualizado as Cliente
}

export async function eliminarCliente(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) {
    logger.error('Error al eliminar el cliente:', error.message)
    return false
  }

  return true
}

// [C2] Conciliación: vincula un cliente invitado existente con
// una cuenta de auth.users nueva, o crea uno nuevo ya vinculado
// si no encuentra coincidencia por email/teléfono.
export async function conciliarCliente(
  authUserId: string,
  email: string,
  telefono: string
): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('conciliar_cliente_con_auth', {
    p_auth_user_id: authUserId,
    p_email: email,
    p_telefono: telefono,
  })

  if (error) {
    logger.error('Error al conciliar cliente con cuenta:', error.message)
    return null
  }

  return data as string
}

// [C8] Eliminacion de fotografias del cliente — Fase 14
export async function eliminarFotografiasCliente(clienteId: string): Promise<{ ok: boolean; eliminadas: number }> {
  const supabase = createClient()

  // Bug real (auditoría enterprise): el cliente de Supabase-js no
  // acepta un query builder como subquery dentro de .in() — solo
  // acepta un array de valores ya resueltos. Antes esto le pasaba
  // el builder completo, lo cual falla en tiempo de ejecución (y
  // ya fallaba el typecheck). Se resuelve primero el listado de
  // cita_id del cliente y luego se usa ese array.
  const { data: citasCliente, error: citasError } = await supabase
    .from('citas')
    .select('id')
    .eq('cliente_id', clienteId)

  if (citasError) {
    logger.error('Error al obtener las citas del cliente:', citasError.message)
    return { ok: false, eliminadas: 0 }
  }

  const citaIds = (citasCliente ?? []).map((c) => c.id)

  if (citaIds.length === 0) {
    return { ok: true, eliminadas: 0 }
  }

  const { data: estilos, error: fetchError } = await supabase
    .from('estilos_referencia')
    .select('id, url_imagen')
    .in('cita_id', citaIds)

  if (fetchError) {
    logger.error('Error al obtener fotografias del cliente:', fetchError.message)
    return { ok: false, eliminadas: 0 }
  }

  if (!estilos || estilos.length === 0) {
    return { ok: true, eliminadas: 0 }
  }

  const paths = estilos
    .map((d) => d.url_imagen)
    .filter((url) => url && !url.startsWith('http'))

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('estilos-referencia')
      .remove(paths)

    if (storageError) {
      logger.error('Error al eliminar archivos de Storage:', storageError.message)
    }
  }

  const ids = estilos.map((d) => d.id)
  const { error: deleteError } = await supabase
    .from('estilos_referencia')
    .delete()
    .in('id', ids)

  if (deleteError) {
    logger.error('Error al eliminar registros de estilos_referencia:', deleteError.message)
    return { ok: false, eliminadas: 0 }
  }

  return { ok: true, eliminadas: ids.length }
}

// ============================================================
// Fase 19: funciones para gestión administrativa de clientes
// ============================================================

export interface ClienteConFrecuencia extends Cliente {
  total_citas: number
  es_frecuente: boolean
  inactivo: boolean
}

export interface ClientesConFrecuenciaResult {
  clientes: ClienteConFrecuencia[]
  total: number
}

// Lista PAGINADA de clientes con frecuencia de visitas calculada.
// "Frecuente" = 3+ citas completadas.
// "Inactivo"  = sin citas completadas en los últimos 60 días.
//
// Auditoría fase 30 (H2): antes traía TODOS los clientes (hasta
// un límite fijo de 500, sin paginación) junto con el listado
// completo de sus citas, y calculaba total_citas/es_frecuente/
// inactivo iterando en JavaScript. Pasado ese límite, clientes
// reales desaparecían del listado sin ningún aviso, y cada
// cliente cargaba su historial completo de citas solo para
// contar y comparar fechas.
//
// Ahora delega el cálculo a la función SQL
// get_clientes_con_frecuencia() (migración 029), que agrega en
// una sola pasada y soporta paginación real via LIMIT/OFFSET.
// Requiere ejecutar esa migración en Supabase.
export async function getClientesConFrecuencia(
  pagina = 1,
  porPagina = 50
): Promise<ClientesConFrecuenciaResult> {
  const supabase = createClient()
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

// Búsqueda por nombre o teléfono (case-insensitive, parcial).
export async function buscarClientes(query: string): Promise<ClienteConFrecuencia[]> {
  const supabase = createClient()

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

// Historial completo de citas de un cliente con servicios y pagos.
export async function getHistorialCliente(clienteId: string): Promise<Cita[]> {
  const supabase = createClient()

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
