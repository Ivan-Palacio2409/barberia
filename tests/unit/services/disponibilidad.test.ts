// tests/unit/services/disponibilidad.test.ts
// Auditoría de calidad (post fase 30) — hallazgo M3: cobertura de
// tests baja en disponibilidad.ts, la lógica con más reglas de
// negocio del proyecto (jornadas, horarios especiales, días
// bloqueados, descansos entre citas, fechas pasadas).
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock de Supabase server client ────────────────────────────
// Cada tabla resuelve a datos configurables por test. El objeto
// devuelto por `from()` es "thenable" (tiene `.then`) para poder
// usarse directo en Promise.all sin llamar a `.single()`, igual
// que hace el código real en getSlotsDisponibles/getFechasDisponibles.
type TablaMock = { data: unknown; error: unknown }

const tablas: Record<string, TablaMock> = {
  horarios_trabajo: { data: [], error: null },
  horarios_especiales: { data: [], error: null },
  dias_bloqueados: { data: [], error: null },
  citas: { data: [], error: null },
  configuracion_negocio: { data: { tiempo_descanso_min: 15 }, error: null },
}

function resetTablas() {
  tablas.horarios_trabajo = { data: [], error: null }
  tablas.horarios_especiales = { data: [], error: null }
  tablas.dias_bloqueados = { data: [], error: null }
  tablas.citas = { data: [], error: null }
  tablas.configuracion_negocio = { data: { tiempo_descanso_min: 15 }, error: null }
}

function makeChain(tabla: string) {
  const resultado = () => tablas[tabla]
  const chain: Record<string, unknown> = {}
  const encadenables = ['select', 'eq', 'neq', 'not', 'gte', 'lte', 'order', 'limit']
  for (const metodo of encadenables) {
    chain[metodo] = () => chain
  }
  chain.single = () => Promise.resolve(resultado())
  chain.maybeSingle = () => Promise.resolve(resultado())
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resultado()).then(resolve)
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: (tabla: string) => makeChain(tabla),
  })),
}))

describe('disponibilidad', () => {
  beforeEach(() => {
    resetTablas()
  })

  describe('toMin / toTime', () => {
    it('convierte HH:MM a minutos y de vuelta sin pérdida', async () => {
      const { toMin, toTime } = await import('@/services/disponibilidad')
      expect(toMin('09:30')).toBe(570)
      expect(toTime(570)).toBe('09:30')
      expect(toMin('00:00')).toBe(0)
      expect(toTime(0)).toBe('00:00')
    })
  })

  describe('getSlotsDisponibles', () => {
    it('devuelve [] para una fecha pasada, sin siquiera consultar horarios', async () => {
      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      const iso = ayer.toISOString().split('T')[0]

      const result = await getSlotsDisponibles(iso, 60)
      expect(result).toEqual([])
    })

    it('devuelve [] si el día está en dias_bloqueados', async () => {
      tablas.dias_bloqueados = { data: [{ fecha: '2999-01-10' }], error: null }
      tablas.horarios_trabajo = {
        data: [{ dia_semana: new Date('2999-01-10T12:00:00').getDay(), hora_inicio: '09:00', hora_fin: '17:00', activo: true }],
        error: null,
      }

      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const result = await getSlotsDisponibles('2999-01-10', 60)
      expect(result).toEqual([])
    })

    it('genera slots dentro de la jornada semanal cuando no hay citas', async () => {
      const diaSemana = new Date('2999-01-11T12:00:00').getDay()
      tablas.horarios_trabajo = {
        data: [{ dia_semana: diaSemana, hora_inicio: '09:00', hora_fin: '11:00', activo: true }],
        error: null,
      }
      tablas.configuracion_negocio = { data: { tiempo_descanso_min: 15 }, error: null }

      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const result = await getSlotsDisponibles('2999-01-11', 60)

      // 09:00–11:00, citas de 60min, descanso 15min entre inicios de slot:
      // 09:00-10:00, 09:15-10:15 ... último que cabe antes de 11:00 es 10:00-11:00
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toEqual({ horaInicio: '09:00', horaFin: '10:00' })
      expect(result[result.length - 1].horaFin <= '11:00').toBe(true)
    })

    it('excluye slots que se solapan con una cita ya ocupada', async () => {
      const diaSemana = new Date('2999-01-12T12:00:00').getDay()
      tablas.horarios_trabajo = {
        data: [{ dia_semana: diaSemana, hora_inicio: '09:00', hora_fin: '12:00', activo: true }],
        error: null,
      }
      // Cita ocupada de 10:00 a 11:00
      tablas.citas = { data: [{ hora_inicio: '10:00', hora_fin: '11:00' }], error: null }
      tablas.configuracion_negocio = { data: { tiempo_descanso_min: 15 }, error: null }

      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const result = await getSlotsDisponibles('2999-01-12', 60)

      // Ningún slot devuelto debe solaparse con [10:00, 11:00)
      for (const slot of result) {
        const solapa = slot.horaInicio < '11:00' && slot.horaFin > '10:00'
        expect(solapa).toBe(false)
      }
    })

    it('un horario especial (día cerrado, activo=false) anula el horario semanal', async () => {
      const diaSemana = new Date('2999-01-13T12:00:00').getDay()
      tablas.horarios_trabajo = {
        data: [{ dia_semana: diaSemana, hora_inicio: '09:00', hora_fin: '17:00', activo: true }],
        error: null,
      }
      tablas.horarios_especiales = {
        data: [{ fecha: '2999-01-13', hora_inicio: '00:00', hora_fin: '00:00', activo: false }],
        error: null,
      }

      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const result = await getSlotsDisponibles('2999-01-13', 60)
      expect(result).toEqual([])
    })

    it('un horario especial activo tiene prioridad sobre el horario semanal', async () => {
      const diaSemana = new Date('2999-01-14T12:00:00').getDay()
      tablas.horarios_trabajo = {
        data: [{ dia_semana: diaSemana, hora_inicio: '09:00', hora_fin: '17:00', activo: true }],
        error: null,
      }
      tablas.horarios_especiales = {
        data: [{ fecha: '2999-01-14', hora_inicio: '14:00', hora_fin: '16:00', activo: true }],
        error: null,
      }

      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const result = await getSlotsDisponibles('2999-01-14', 60)

      expect(result.every((s) => s.horaInicio >= '14:00' && s.horaFin <= '16:00')).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('devuelve [] si no hay horario de trabajo configurado para ese día', async () => {
      tablas.horarios_trabajo = { data: [], error: null }
      const { getSlotsDisponibles } = await import('@/services/disponibilidad')
      const result = await getSlotsDisponibles('2999-01-15', 60)
      expect(result).toEqual([])
    })
  })
})
