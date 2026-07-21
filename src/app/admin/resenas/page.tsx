// ============================================================
// src/app/admin/resenas/page.tsx — Fase 22
// Panel de moderacion de resenas.
// ============================================================

import { getResenasServer, getPromedioCalificacionServer } from '@/services/resenas-ssr'
import { ResenasAdminShell } from '@/components/admin/resenas'

export const metadata = {
  title: 'Resenas | Admin BARBERÍA',
}

export default async function ResenasAdminPage() {
  const [resenas, { promedio, total }] = await Promise.all([
    getResenasServer(),
    getPromedioCalificacionServer(),
  ])

  return (
    <ResenasAdminShell
      resenas={resenas}
      promedio={promedio}
      total={total}
    />
  )
}
