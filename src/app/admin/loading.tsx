// ============================================================
// src/app/admin/loading.tsx
//
// Boundary de Suspense propio del segmento /admin. Al no existir
// antes, la navegación entre secciones del panel (Dashboard,
// Calendario, Clientes, Estadísticas, etc. — todas Server
// Components que hacen fetch) se quedaba "congelada" sin ningún
// indicador hasta que la siguiente página terminaba de cargar,
// porque el único loading.tsx era el de la raíz del sitio y no
// aplica a navegaciones dentro del mismo layout anidado.
//
// Este archivo solo reemplaza el <main> del layout admin
// (AdminSidebar y AdminNavbar se mantienen montados), así la
// navegación se siente instantánea y con feedback visual claro.
// ============================================================

import { PageLoader } from '@/components/shared/LoadingSpinner'

export default function AdminLoading() {
  return <PageLoader />
}
