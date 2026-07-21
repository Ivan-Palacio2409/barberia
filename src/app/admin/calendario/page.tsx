// ============================================================
// src/app/admin/calendario/page.tsx — Fase 18
// Calendario de citas con vistas dia / semana / mes y
// actualizacion en tiempo real via Supabase Realtime.
// Server Component: carga inicial de citas del mes.
// ============================================================

import { getCitasByRango } from '@/services/calendario'
import { CalendarioShell } from '@/components/admin/calendario'

export const metadata = {
  title: 'Calendario | Admin BARBERÍA',
}

// Cargar rango amplio (mes anterior + 2 meses siguientes) para
// que las 3 vistas tengan datos sin recargar.
function getRango(): { desde: string; hasta: string } {
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 10)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)
    .toISOString()
    .slice(0, 10)
  return { desde, hasta }
}

export default async function CalendarioPage() {
  const { desde, hasta } = getRango()
  const citas = await getCitasByRango(desde, hasta)
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Calendario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vistas dia, semana y mes. Se actualiza en tiempo real.
        </p>
      </div>

      <CalendarioShell citasIniciales={citas} fechaInicial={hoy} />
    </div>
  )
}
