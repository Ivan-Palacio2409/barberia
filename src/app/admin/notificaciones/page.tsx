// ============================================================
// src/app/admin/notificaciones/page.tsx — Fase 24
// Panel admin de notificaciones: historial, filtros, reenvio.
// ============================================================

import { getNotificacionesAdmin, getResumenNotificaciones } from '@/services/notificaciones-admin-ssr'
import { NotificacionesAdminShell } from '@/components/admin/notificaciones'

export const metadata = {
  title: 'Notificaciones | Admin BARBERÍA',
}

export default async function NotificacionesAdminPage() {
  const [notificaciones, resumen] = await Promise.all([
    getNotificacionesAdmin(),
    getResumenNotificaciones(),
  ])

  return (
    <NotificacionesAdminShell
      notificaciones={notificaciones}
      resumen={resumen}
    />
  )
}
