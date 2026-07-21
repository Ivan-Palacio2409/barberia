// ============================================================
// src/app/admin/lista-espera/page.tsx — Fase 23
// Panel admin de lista de espera.
// ============================================================

import { getListaEsperaAdmin, getResumenListaEspera } from '@/services/lista-espera-admin'
import { ListaEsperaAdminShell } from '@/components/admin/lista-espera'

export const metadata = {
  title: 'Lista de espera | Admin BARBERÍA',
}

export default async function ListaEsperaAdminPage() {
  const [solicitudes, resumen] = await Promise.all([
    getListaEsperaAdmin(),
    getResumenListaEspera(),
  ])

  return (
    <ListaEsperaAdminShell
      solicitudes={solicitudes}
      resumen={resumen}
    />
  )
}
