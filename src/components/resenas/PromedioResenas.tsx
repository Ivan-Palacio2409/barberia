import { StarRating } from './StarRating'

interface PromedioResenasProps {
  promedio: number
  total: number
}

export function PromedioResenas({ promedio, total }: PromedioResenasProps) {
  const redondeado = Math.round(promedio)

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <span className="text-5xl font-bold text-[var(--pub-text)]" style={{ fontFamily: 'var(--font-display)' }}>
        {promedio > 0 ? promedio.toFixed(1) : '—'}
      </span>
      <StarRating value={redondeado} readonly size="md" />
      <p className="text-sm text-[var(--pub-text-muted)]">
        {total === 0
          ? 'Sin reseñas aún'
          : `Basado en ${total} ${total === 1 ? 'reseña' : 'reseñas'}`}
      </p>
    </div>
  )
}
