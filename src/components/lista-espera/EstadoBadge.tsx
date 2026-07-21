import type { EstadoListaEspera } from '@/types'

const CONFIG: Record<EstadoListaEspera, { label: string; bg: string; color: string }> = {
  en_espera:  { label: 'En espera',  bg: '#FFF8E6', color: '#B45309' },
  notificado: { label: 'Notificado', bg: '#EFF6FF', color: '#1D4ED8' },
  convertido: { label: 'Convertido', bg: '#F0FDF4', color: '#15803D' },
  cancelado:  { label: 'Cancelado',  bg: '#FEF2F2', color: '#B91C1C' },
}

export function EstadoBadge({ estado }: { estado: EstadoListaEspera }) {
  const c = CONFIG[estado] ?? CONFIG.en_espera
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  )
}
