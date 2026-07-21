'use client'

interface Props {
  categorias: { id: string; nombre: string }[]
  activeId: string | null
  onChange: (id: string | null) => void
  total: number
}

export function GalleryFilter({ categorias, activeId, onChange, total }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      role="group"
      aria-label="Filtrar por categoría"
    >
      {/* Opción "Todos" */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
        aria-pressed={activeId === null}
        style={
          activeId === null
            ? {
                background:
                  'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                color: 'var(--pub-on-gold)',
                boxShadow: '0 4px 14px rgba(245, 245, 245,0.35)',
              }
            : {
                background: 'rgba(245, 245, 245,0.08)',
                color: 'var(--pub-text-muted)',
              }
        }
      >
        Todos ({total})
      </button>

      {categorias.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
          aria-pressed={activeId === cat.id}
          style={
            activeId === cat.id
              ? {
                  background:
                    'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                  color: 'var(--pub-on-gold)',
                  boxShadow: '0 4px 14px rgba(245, 245, 245,0.35)',
                }
              : {
                  background: 'rgba(245, 245, 245,0.08)',
                  color: 'var(--pub-text-muted)',
                }
          }
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  )
}
