import { createClient } from '@/lib/supabase/server'
import type { CitaCalendario, NuevaCitaManualInput, EstadoCita } from '@/types'

// ============================================================
// src/services/calendario.ts — Fase 18
// Consultas de servidor para el calendario administrativo.
// ============================================================

const CITA_SELECT = `
  id,
  fecha,
  hora_inicio,
  hora_fin,
  estado,
  precio_total,
  notas,
  clientes ( id, nombre, telefono ),
  cita_servicios (
    servicios ( id, nombre, duracion_minutos, precio )
  )
`

interface RawCitaRow {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoCita
  precio_total: number | string | null
  notas: string | null
  clientes: { id: string; nombre: string; telefono: string }[]
  cita_servicios: {
    servicios: { id: string; nombre: string; duracion_minutos: number; precio: number }[]
  }[]
}

function mapCita(c: RawCitaRow): CitaCalendario {
  const cliente = c.clientes?.[0]
  return {
    id: c.id,
    fecha: c.fecha,
    hora_inicio: c.hora_inicio,
    hora_fin: c.hora_fin,
    estado: c.estado,
    precio_total: Number(c.precio_total ?? 0),
    notas: c.notas ?? undefined,
    cliente: {
      id: cliente?.id ?? '',
      nombre: cliente?.nombre ?? 'Sin nombre',
      telefono: cliente?.telefono ?? '',
    },
    servicios: (c.cita_servicios ?? []).map((cs) => {
      const s = cs.servicios?.[0]
      return {
        id: s?.id ?? '',
        nombre: s?.nombre ?? '',
        duracion_minutos: s?.duracion_minutos ?? 0,
        precio: Number(s?.precio ?? 0),
      }
    }),
  }
}

// ── Citas de un dia especifico ────────────────────────────────
export async function getCitasByFecha(fecha: string): Promise<CitaCalendario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('citas')
    .select(CITA_SELECT)
    .eq('fecha', fecha)
    .order('hora_inicio', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapCita)
}

// ── Citas de un rango de fechas ───────────────────────────────
export async function getCitasByRango(
  desde: string,
  hasta: string
): Promise<CitaCalendario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('citas')
    .select(CITA_SELECT)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapCita)
}

// ── Crear cita manual ─────────────────────────────────────────
export async function crearCitaManual(input: NuevaCitaManualInput): Promise<string> {
  const supabase = await createClient()

  // Calcular duracion total sumando servicios seleccionados
  const { data: serviciosData } = await supabase
    .from('servicios')
    .select('duracion_minutos, precio')
    .in('id', input.servicio_ids)

  const duracionTotal = (serviciosData ?? []).reduce(
    (acc, s) => acc + (s.duracion_minutos ?? 0),
    0
  )
  const precioTotal = (serviciosData ?? []).reduce(
    (acc, s) => acc + Number(s.precio ?? 0),
    0
  )

  // Calcular hora_fin
  const [h, m] = input.hora_inicio.split(':').map(Number)
  const inicioMin = h * 60 + m
  const finMin = inicioMin + duracionTotal
  const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`
  const horaInicioFmt = `${input.hora_inicio}:00`

  // Verificar solapamiento via RPC (el trigger de BD tambien lo rechaza)
  const { data: solapadas } = await supabase
    .from('citas')
    .select('id')
    .eq('fecha', input.fecha)
    .neq('estado', 'cancelada')
    .or(`hora_inicio.lt.${horaFin},hora_fin.gt.${horaInicioFmt}`)

  if (solapadas && solapadas.length > 0) {
    throw new Error('Ya existe una cita en ese horario. Por favor elige otro.')
  }

  // Insertar cita
  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .insert({
      cliente_id: input.cliente_id,
      fecha: input.fecha,
      hora_inicio: horaInicioFmt,
      hora_fin: horaFin,
      estado: 'confirmada',
      precio_total: precioTotal,
      notas: input.notas ?? null,
    })
    .select('id')
    .single()

  if (citaError || !cita) throw new Error(citaError?.message ?? 'Error al crear la cita.')

  // Insertar cita_servicios
  if (input.servicio_ids.length > 0) {
    const { error: csError } = await supabase
      .from('cita_servicios')
      .insert(input.servicio_ids.map((sid) => ({ cita_id: cita.id, servicio_id: sid })))
    if (csError) throw new Error(csError.message)
  }

  return cita.id
}
