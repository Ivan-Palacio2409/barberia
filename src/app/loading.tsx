// ============================================================
// src/app/loading.tsx
// Auditoría enterprise (Revisión 1 — rendimiento frontend /
// Revisión 6 — disponibilidad): varias páginas son Server
// Components que hacen fetch antes de renderizar (ej.
// (public)/servicios, admin/reportes). Sin este archivo, Next.js
// no muestra nada durante ese fetch — pantalla en blanco hasta
// que resuelve. Este loading.tsx activa el streaming/Suspense
// automático de Next.js para TODAS las rutas hijas que no tengan
// su propio loading.tsx más específico.
//
// PageLoader ya existía en components/shared/LoadingSpinner.tsx
// pero no estaba conectado a ningún route segment — solo se
// usaba manualmente en algunos componentes cliente.
// ============================================================

import { PageLoader } from '@/components/shared/LoadingSpinner'

export default function Loading() {
  return <PageLoader />
}
