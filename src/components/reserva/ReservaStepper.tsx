'use client'

interface Paso {
  numero: number
  label: string
}

const PASOS: Paso[] = [
  { numero: 1, label: 'Servicios' },
  { numero: 2, label: 'Fecha' },
  { numero: 3, label: 'Horario' },
  { numero: 4, label: 'Datos' },
  { numero: 5, label: 'Fotos' },
  { numero: 6, label: 'Confirmacion' },
]

interface Props {
  pasoActual: number
}

export function ReservaStepper({ pasoActual }: Props) {
  const actual = PASOS[pasoActual - 1]
  return (
    <div aria-label="Progreso de reserva">
      {/* Etiqueta "PASO 0X" — como en la referencia de diseño */}
      <div className="mb-4 flex items-baseline gap-3">
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--pub-gold-strong)' }}
        >
          Paso {String(pasoActual).padStart(2, '0')}
        </span>
        <span className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
          {actual?.label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full mb-6 overflow-hidden"
        style={{ background: 'rgba(245, 245, 245,0.1)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((pasoActual - 1) / (PASOS.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
          }}
        />
      </div>

      {/* Circles — desktop */}
      <div className="hidden sm:flex items-center justify-between mb-2">
        {PASOS.map((p) => {
          const done = p.numero < pasoActual
          const active = p.numero === pasoActual
          return (
            <div key={p.numero} className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  done
                    ? {
                        background:
                          'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                        color: 'var(--pub-on-gold)',
                      }
                    : active
                    ? {
                        background: 'var(--pub-bg-soft)',
                        border: '2px solid var(--pub-gold-strong)',
                        color: 'var(--pub-gold-strong)',
                      }
                    : {
                        background: 'rgba(245, 245, 245,0.08)',
                        color: 'var(--pub-text-muted)',
                      }
                }
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--pub-on-gold)"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  p.numero
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: active ? 'var(--pub-gold-strong)' : 'var(--pub-text-muted)',
                }}
              >
                {p.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile: solo texto */}
      <div className="sm:hidden flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--pub-gold-strong)' }}>
          Paso {pasoActual} de {PASOS.length}
        </p>
        <p className="text-xs font-medium" style={{ color: 'var(--pub-text-muted)' }}>
          {PASOS[pasoActual - 1]?.label}
        </p>
      </div>
    </div>
  )
}
