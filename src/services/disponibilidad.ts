import { createClient } from '@/lib/supabase/server'
import { toMin, toTime, nombreDia, formatFechaLarga } from '@/lib/disponibilidad-utils'
import { hoyDate, hoyISO } from '@/lib/date-utils'

// Re-exportadas para no romper otros imports server-side existentes
// (ej. server actions). Los Client Components deben importar estas
// funciones puras directamente de '@/lib/disponibilidad-utils',
// nunca de este archivo — ver el comentario en ese módulo.
export { toMin, toTime, nombreDia, formatFechaLarga }

// ============================================================
// Tipos locales
// ============================================================

interface HorarioTrabajo {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  activo: boolean
  bloque?: 'manana' | 'tarde'
}

type Jornada = { inicio: number; fin: number }

interface HorarioEspecial {
  fecha: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

interface CitaOcupada {
  fecha: string
  hora_inicio: string
  hora_fin: string
}

// ============================================================
// Helpers
// ============================================================

/**
 * Devuelve true si existe al menos un slot libre en el rango del día
 * dados los bloques ya ocupados y la duración requerida.
 */
function haySlotLibre(
  inicioJornada: number,
  finJornada: number,
  bloques: Array<{ inicio: number; fin: number }>,
  duracion: number,
  descanso: number,
): boolean {
  // Ordenar bloques ocupados
  const sorted = [...bloques].sort((a, b) => a.inicio - b.inicio)

  let cursor = inicioJornada

  for (const bloque of sorted) {
    if (cursor + duracion <= bloque.inicio) return true
    cursor = Math.max(cursor, bloque.fin + descanso)
  }

  return cursor + duracion <= finJornada
}

// ============================================================
// API pública
// ============================================================

/**
 * Devuelve las fechas disponibles (ISO YYYY-MM-DD) para los
 * próximos `diasAdelante` días dados la duración requerida.
 *
 * Lógica:
 * 1. Obtener horarios_trabajo activos (o horarios_especiales).
 * 2. Excluir dias_bloqueados.
 * 3. Para cada fecha candidata verificar si existe al menos un
 *    slot libre (duracion + descanso entre citas).
 */
export async function getFechasDisponibles(
  duracionMinutos: number,
  diasAdelante = 60,
): Promise<string[]> {
  const supabase = await createClient()

  const hoy = hoyDate()

  const hasta = new Date(hoy)
  hasta.setDate(hasta.getDate() + diasAdelante)
  const hastaISO = hasta.toISOString().split('T')[0]
  const hoyStr = hoyISO()

  // Fetch en paralelo
  const [
    { data: horarios },
    { data: especiales },
    { data: bloqueados },
    { data: citas },
    { data: config },
  ] = await Promise.all([
    supabase
      .from('horarios_trabajo')
      .select('dia_semana, hora_inicio, hora_fin, activo')
      .eq('activo', true),
    supabase
      .from('horarios_especiales')
      .select('fecha, hora_inicio, hora_fin, activo')
      .gte('fecha', hoyStr)
      .lte('fecha', hastaISO),
    supabase
      .from('dias_bloqueados')
      .select('fecha')
      .gte('fecha', hoyStr)
      .lte('fecha', hastaISO),
    supabase
      .from('citas')
      .select('fecha, hora_inicio, hora_fin')
      .gte('fecha', hoyStr)
      .lte('fecha', hastaISO)
      .not('estado', 'eq', 'cancelada'),
    supabase
      .from('configuracion_negocio')
      .select('tiempo_descanso_min')
      .limit(1)
      .single(),
  ])

  const tiempoDescanso: number = config?.tiempo_descanso_min ?? 15

  const diasBloqueadosSet = new Set<string>(
    (bloqueados ?? []).map((d) => d.fecha),
  )

  // Un día puede tener varios bloques activos (ej. mañana 08:00-13:00
  // y tarde 14:00-18:00 para jornada partida), por eso agrupamos en
  // un array en vez de quedarnos con un único horario por día.
  const horariosMap = new Map<number, Jornada[]>()
  for (const h of (horarios as HorarioTrabajo[] ?? [])) {
    const lista = horariosMap.get(h.dia_semana) ?? []
    lista.push({ inicio: toMin(h.hora_inicio), fin: toMin(h.hora_fin) })
    horariosMap.set(h.dia_semana, lista)
  }

  const especialesMap = new Map<string, HorarioEspecial>(
    (especiales as HorarioEspecial[] ?? []).map((e) => [e.fecha, e]),
  )

  // Agrupar citas ocupadas por fecha
  const citasPorFecha = new Map<string, Array<{ inicio: number; fin: number }>>()
  for (const c of (citas as CitaOcupada[] ?? [])) {
    const list = citasPorFecha.get(c.fecha) ?? []
    list.push({ inicio: toMin(c.hora_inicio), fin: toMin(c.hora_fin) })
    citasPorFecha.set(c.fecha, list)
  }

  const fechasDisponibles: string[] = []

  const cursor = new Date(hoy)
  // Empezar desde mañana para no ofrecer el mismo día
  cursor.setDate(cursor.getDate() + 1)

  while (cursor <= hasta) {
    const iso = cursor.toISOString().split('T')[0]
    const diaSemana = cursor.getDay() // 0=Dom … 6=Sab

    if (!diasBloqueadosSet.has(iso)) {
      // Determinar jornadas del día: especial tiene prioridad
      const especial = especialesMap.get(iso)
      let jornadas: Jornada[] = []

      if (especial) {
        if (especial.activo) {
          jornadas = [{ inicio: toMin(especial.hora_inicio), fin: toMin(especial.hora_fin) }]
        }
        // si especial.activo = false → día cerrado
      } else {
        jornadas = horariosMap.get(diaSemana) ?? []
      }

      if (jornadas.length > 0) {
        const bloques = citasPorFecha.get(iso) ?? []
        const hayLibre = jornadas.some((j) =>
          haySlotLibre(j.inicio, j.fin, bloques, duracionMinutos, tiempoDescanso),
        )
        if (hayLibre) {
          fechasDisponibles.push(iso)
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return fechasDisponibles
}

// ============================================================
// Alias exportado para uso en Step 1 (pre-fetch sin duracion)
// ============================================================

// ============================================================
// Fase 11 — getSlotsDisponibles
// Dado una fecha ISO y la duración total de la cita, devuelve
// los slots de inicio disponibles en formato "HH:MM".
// ============================================================

export interface Slot {
  horaInicio: string // "HH:MM"
  horaFin: string    // "HH:MM"
}

export async function getSlotsDisponibles(
  fecha: string,
  duracionMinutos: number,
): Promise<Slot[]> {
  const supabase = await createClient()

  // QA fase 30: sin este guard, getSlotsDisponibles() (y por lo
  // tanto crearCitaCompleta, que re-valida contra esta misma
  // función) podía devolver slots "válidos" para una fecha ya
  // pasada, porque el cálculo solo mira horarios de trabajo y
  // citas existentes, nunca compara contra la fecha de hoy.
  const hoyStr = hoyISO()
  if (fecha < hoyStr) return []

  const diaSemana = new Date(fecha + 'T12:00:00').getDay()

  const [
    { data: horarios },
    { data: especiales },
    { data: bloqueados },
    { data: citas },
    { data: config },
  ] = await Promise.all([
    supabase
      .from('horarios_trabajo')
      .select('dia_semana, hora_inicio, hora_fin, activo, bloque')
      .eq('dia_semana', diaSemana)
      .eq('activo', true)
      .order('hora_inicio', { ascending: true }),
    supabase
      .from('horarios_especiales')
      .select('fecha, hora_inicio, hora_fin, activo')
      .eq('fecha', fecha),
    supabase
      .from('dias_bloqueados')
      .select('fecha')
      .eq('fecha', fecha),
    supabase
      .from('citas')
      .select('hora_inicio, hora_fin')
      .eq('fecha', fecha)
      .not('estado', 'eq', 'cancelada'),
    supabase
      .from('configuracion_negocio')
      .select('tiempo_descanso_min')
      .limit(1)
      .single(),
  ])

  // Día bloqueado → sin slots
  if (bloqueados && bloqueados.length > 0) return []

  const tiempoDescanso: number = config?.tiempo_descanso_min ?? 15

  // Determinar jornadas (especial tiene prioridad sobre semanal).
  // El día puede tener más de un bloque de trabajo (jornada partida:
  // mañana + tarde), así que se generan slots dentro de cada bloque
  // por separado — nunca se ofrece un slot que cruce el descanso.
  const especial = especiales?.[0]
  let jornadas: Jornada[] = []

  if (especial) {
    if (especial.activo) {
      jornadas = [{ inicio: toMin(especial.hora_inicio), fin: toMin(especial.hora_fin) }]
    }
  } else {
    jornadas = ((horarios ?? []) as HorarioTrabajo[]).map((h) => ({
      inicio: toMin(h.hora_inicio),
      fin: toMin(h.hora_fin),
    }))
  }

  if (jornadas.length === 0) return []

  // Bloques ocupados
  const bloquesCitas = ((citas ?? []) as CitaOcupada[]).map((c) => ({
    inicio: toMin(c.hora_inicio),
    fin: toMin(c.hora_fin),
  }))
  bloquesCitas.sort((a, b) => a.inicio - b.inicio)

  const slots: Slot[] = []

  for (const jornada of jornadas) {
    let cursor = jornada.inicio

    while (cursor + duracionMinutos <= jornada.fin) {
      const slotFin = cursor + duracionMinutos

      // Verificar que no choca con ninguna cita ocupada
      const choca = bloquesCitas.some(
        (b) => cursor < b.fin && slotFin > b.inicio,
      )

      if (!choca) {
        slots.push({
          horaInicio: toTime(cursor),
          horaFin: toTime(slotFin),
        })
      }

      cursor += tiempoDescanso
    }
  }

  return slots
}