// tests/unit/lib/export.test.ts
import { describe, it, expect } from 'vitest'
import { objectsToCSV } from '@/lib/export/csv'

describe('objectsToCSV', () => {
  it('genera cabeceras y filas correctamente', () => {
    const resultado = objectsToCSV([
      { nombre: 'Maria Lopez', monto: 50000 },
      { nombre: 'Juan Perez', monto: 80000 },
    ])
    expect(resultado).toContain('nombre,monto')
    expect(resultado).toContain('Maria Lopez,50000')
    expect(resultado).toContain('Juan Perez,80000')
  })

  it('escapa comas dentro de los valores', () => {
    const resultado = objectsToCSV([{ nombre: 'Lopez, Maria' }])
    expect(resultado).toContain('"Lopez, Maria"')
  })

  it('retorna cadena vacia si no hay filas', () => {
    expect(objectsToCSV([])).toBe('')
  })

  it('escapa comillas dobles en valores', () => {
    const resultado = objectsToCSV([{ nota: 'dijo "hola"' }])
    expect(resultado).toContain('"dijo ""hola"""')
  })

  it('convierte null y undefined a cadena vacia', () => {
    const resultado = objectsToCSV([{ campo: null, otro: undefined }])
    const lineas = resultado.split('\r\n')
    expect(lineas[1]).toBe(',')
  })

  it('usa CRLF como separador de lineas', () => {
    const resultado = objectsToCSV([{ a: '1' }, { a: '2' }])
    expect(resultado).toContain('\r\n')
  })
})
