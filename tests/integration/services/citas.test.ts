// tests/integration/services/citas.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockOrder  = vi.fn()
const mockEq     = vi.fn().mockReturnThis()
const mockSelect = vi.fn().mockReturnThis()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
    })),
  }),
}))

describe('getCitasByCliente', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna array vacio si supabase retorna error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const { getCitasByCliente } = await import('@/services/citas')
    const result = await getCitasByCliente('cliente-abc')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('retorna citas si supabase retorna datos', async () => {
    const mockCitas = [
      {
        id: 'cita-1',
        fecha: '2025-08-01',
        hora_inicio: '10:00',
        hora_fin: '11:00',
        estado: 'confirmada',
        cliente_id: 'cliente-abc',
        servicios: [],
      },
    ]
    mockOrder.mockResolvedValue({ data: mockCitas, error: null })
    const { getCitasByCliente } = await import('@/services/citas')
    const result = await getCitasByCliente('cliente-abc')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('cita-1')
    expect(result[0].estado).toBe('confirmada')
  })
})
