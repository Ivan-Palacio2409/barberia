// ============================================================
// src/app/admin/citas/[id]/page.tsx — Fase 19
// Detalle de cita: datos del cliente, servicios + duración,
// badge de estado, imágenes de referencia (signed URLs),
// historial del cliente, pagos registrados y acciones:
// Confirmar / Completar / Reagendar / Cancelar / Registrar pago.
// ============================================================

import { notFound } from 'next/navigation'
import { getCitaById } from '@/services/citas'
import { getHistorialCliente } from '@/services/clientes'
import { DetalleCitaShell } from '@/components/admin/citas/DetalleCitaShell'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const cita = await getCitaById(id)
  return {
    title: cita
      ? `Cita ${cita.fecha} | Admin BARBERÍA`
      : 'Detalle de cita | Admin BARBERÍA',
  }
}

export default async function DetalleCitaPage({ params }: Props) {
  const { id } = await params
  const cita = await getCitaById(id)
  if (!cita) notFound()

  const historial = await getHistorialCliente(cita.cliente_id)

  return <DetalleCitaShell cita={cita} historial={historial} />
}
