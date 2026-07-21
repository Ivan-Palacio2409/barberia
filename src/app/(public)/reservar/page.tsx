import type { Metadata } from 'next'
import { ReservaShell } from '@/components/reserva/ReservaShell'
import { getServiciosPorCategoria } from '@/services/servicios-ssr'

export const metadata: Metadata = {
  title: 'Reservar cita — BARBERÍA',
  description: 'Reserva tu cita en BARBERÍA en pocos pasos. Elige servicio, fecha y horario.',
}

// No cachear — la disponibilidad cambia constantemente
export const dynamic = 'force-dynamic'

export default async function ReservarPage() {
  const categorias = await getServiciosPorCategoria()

  return <ReservaShell categorias={categorias} />
}
