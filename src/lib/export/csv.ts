// ============================================================
// src/lib/export/csv.ts — Fase 25
// Utilidad para generar y descargar archivos CSV desde el navegador.
// ============================================================

/**
 * Convierte un array de objetos a texto CSV.
 * Escapa comillas dobles y envuelve campos que contengan comas/saltos.
 */
export function objectsToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ]

  return lines.join('\r\n')
}

/**
 * Dispara la descarga de un archivo CSV en el navegador.
 */
export function descargarCSV(csv: string, nombreArchivo: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}
