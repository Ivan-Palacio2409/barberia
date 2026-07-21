// tests/unit/lib/rate-limit.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('permite la primera solicitud', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const { allowed, remaining } = checkRateLimit('1.2.3.4_a')
    expect(allowed).toBe(true)
    expect(remaining).toBe(59)
  })

  it('permite 60 solicitudes y bloquea la 61', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const ip = '10.0.0.99'
    for (let i = 0; i < 60; i++) checkRateLimit(ip)
    const { allowed } = checkRateLimit(ip)
    expect(allowed).toBe(false)
  })

  it('resetea el contador despues de 1 minuto', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const ip = '10.0.0.88'
    for (let i = 0; i < 60; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).allowed).toBe(false)

    vi.advanceTimersByTime(60_001)
    expect(checkRateLimit(ip).allowed).toBe(true)
  })
})
