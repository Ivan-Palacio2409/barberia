// tests/unit/lib/validations.test.ts
import { describe, it, expect } from 'vitest'
import {
  datosClienteReservaSchema,
  registroSchema,
  loginSchema,
  telefonoColombiano,
  emailSchema,
} from '@/lib/validations/index'

describe('datosClienteReservaSchema', () => {
  it('acepta datos validos', () => {
    const result = datosClienteReservaSchema.safeParse({
      nombre: 'Maria Lopez',
      telefono: '3001234567',
      consentimientoDatos: true,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre vacio', () => {
    const result = datosClienteReservaSchema.safeParse({
      nombre: '',
      telefono: '3001234567',
      consentimientoDatos: true,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza sin consentimiento', () => {
    const result = datosClienteReservaSchema.safeParse({
      nombre: 'Maria',
      telefono: '3001234567',
      consentimientoDatos: false,
    })
    expect(result.success).toBe(false)
  })
})

describe('registroSchema', () => {
  it('acepta registro valido', () => {
    const result = registroSchema.safeParse({
      nombre: 'Maria Lopez',
      email: 'maria@example.com',
      telefono: '3001234567',
      password: 'secreto123',
      confirmPassword: 'secreto123',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza passwords distintos', () => {
    const result = registroSchema.safeParse({
      nombre: 'Maria',
      email: 'maria@example.com',
      telefono: '3001234567',
      password: 'secreto123',
      confirmPassword: 'otro',
    })
    expect(result.success).toBe(false)
  })
})

describe('telefonoColombiano', () => {
  it('acepta numero valido', () => {
    expect(telefonoColombiano.safeParse('3001234567').success).toBe(true)
  })

  it('rechaza numero que no inicia en 3', () => {
    expect(telefonoColombiano.safeParse('2001234567').success).toBe(false)
  })

  it('rechaza numero con menos de 10 digitos', () => {
    expect(telefonoColombiano.safeParse('300123').success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('acepta email valido', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true)
  })

  it('rechaza email sin arroba', () => {
    expect(emailSchema.safeParse('noatarroba.com').success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('acepta login valido', () => {
    const result = loginSchema.safeParse({
      email: 'admin@forma.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })
})
