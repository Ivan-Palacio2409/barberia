// tests/unit/hooks/usePushNotifications.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('detecta sin_soporte si PushManager no esta disponible', () => {
    // jsdom no implementa PushManager
    const { result } = renderHook(() => usePushNotifications('cliente-123'))
    // En jsdom: 'serviceWorker' in navigator = false
    expect(['sin_soporte', 'desconocido']).toContain(result.current.estado)
  })

  it('estado inicial cargando=false', () => {
    const { result } = renderHook(() => usePushNotifications(null))
    expect(result.current.cargando).toBe(false)
  })

  it('no lanza error al llamar suscribir sin soporte', async () => {
    const { result } = renderHook(() => usePushNotifications('cliente-123'))
    await expect(result.current.suscribir()).resolves.not.toThrow()
  })
})
