// ============================================================
// src/app/admin/reportes/page.tsx — Fase 25
// Server Component: carga el reporte del mes actual y pasa al
// ReportesShell (Client Component) que maneja filtros y tabs.
// ============================================================

import { getReporteResumen } from '@/services/reportes'
import { ReportesShell } from '@/components/admin/reportes'

export const metadata = {
  title: 'Estadísticas | Admin BARBERÍA',
}

export default async function ReportesPage() {
  const reporte = await getReporteResumen()

  return <ReportesShell reporte={reporte} />
}
