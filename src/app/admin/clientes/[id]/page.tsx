// ============================================================
// src/app/admin/clientes/[id]/page.tsx — Fase 19
// Ficha completa del cliente: info personal, observaciones,
// historial de citas, servicios realizados, galería de diseños
// de referencia y frecuencia de asistencia.
// ============================================================

import { notFound } from 'next/navigation'
import { getClienteById, getHistorialCliente } from '@/services/clientes-ssr'
import { FichaClienteShell } from '@/components/admin/clientes/FichaClienteShell'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const cliente = await getClienteById(id)
  return { title: cliente ? `${cliente.nombre} | Clientes Admin` : 'Cliente | Admin BARBERÍA' }
}

export default async function FichaClientePage({ params }: Props) {
  const { id } = await params
  const [cliente, historial] = await Promise.all([
    getClienteById(id),
    getHistorialCliente(id),
  ])

  if (!cliente) notFound()

  return <FichaClienteShell cliente={cliente} historial={historial} />
}