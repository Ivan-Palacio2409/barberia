// tests/integration/services/push.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { guardarSuscripcion } from '@/services/push'

const mockUpsert = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      upsert: mockUpsert,
      delete: () => ({ eq: vi.fn().mockReturnThis() }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}))

describe('push service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('guardarSuscripcion llama upsert con campos correctos', async () => {
    mockUpsert.mockResolvedValue({ error: null })

    const mockSub = {
      toJSON: () => ({
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key-p256', auth: 'key-auth' },
      }),
    } as unknown as PushSubscription

    const result = await guardarSuscripcion('cliente-abc', mockSub)
    expect(result.ok).toBe(true)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cliente_id: 'cliente-abc',
        endpoint: 'https://push.example.com/123',
        p256dh: 'key-p256',
        auth: 'key-auth',
      }),
      { onConflict: 'cliente_id,endpoint' }
    )
  })

  it('retorna error si supabase falla', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })

    const mockSub = {
      toJSON: () => ({
        endpoint: 'https://push.example.com/456',
        keys: { p256dh: 'k1', auth: 'k2' },
      }),
    } as unknown as PushSubscription

    const result = await guardarSuscripcion('cliente-abc', mockSub)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('DB error')
  })
})
