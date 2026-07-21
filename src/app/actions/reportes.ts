'use server'

// ============================================================
// src/app/actions/reportes.ts — Fase 25
// Server Actions para el panel de reportes con filtros de fecha.
// ============================================================

import { getReporteConFiltros, getReportePorServicio } from '@/services/reportes'
import type { ReporteFiltrado, ServicioRendimiento } from '@/services/reportes'

export async function fetchReporteConFiltros(
  desde: string,
  hasta: string
): Promise<ReporteFiltrado> {
  return getReporteConFiltros(desde, hasta)
}

export async function fetchReportePorServicio(
  desde: string,
  hasta: string
): Promise<ServicioRendimiento[]> {
  return getReportePorServicio(desde, hasta)
}
