// tests/unit/hooks/useServiceWorker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useServiceWorker } from '@/hooks/useServiceWorker'

describe('useServiceWorker', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('retorna updateDisponible=false por defecto', () => {
    // jsdom no tiene serviceWorker en navigator
    const { result } = renderHook(() => useServiceWorker())
    expect(result.current.updateDisponible).toBe(false)
  })

  it('no lanza error si serviceWorker no esta disponible', () => {
    const { result } = renderHook(() => useServiceWorker())
    expect(() => result.current.aplicarActualizacion()).not.toThrow()
  })
})
