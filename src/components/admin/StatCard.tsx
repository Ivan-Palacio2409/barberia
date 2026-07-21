// ============================================================
// StatCard.tsx — Fase 17
// Tarjeta de metrica para el dashboard administrativo.
// ============================================================

interface StatCardProps {
  titulo: string
  valor: string
  subtitulo?: string
  icon: React.ReactNode
  colorClase?: string
}

export function StatCard({ titulo, valor, subtitulo, icon, colorClase = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`mt-0.5 shrink-0 ${colorClase}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{titulo}</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{valor}</p>
        {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
      </div>
    </div>
  )
}
