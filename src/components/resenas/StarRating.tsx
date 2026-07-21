'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: 16,
  md: 22,
  lg: 28,
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const px = SIZE_MAP[size]

  return (
    <div
      className="flex gap-1"
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={`Calificación: ${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (readonly ? value : hovered || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-transform duration-100 focus:outline-none ${
              !readonly ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
            }`}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill={active ? 'var(--pub-gold)' : 'none'}
              stroke={active ? 'var(--pub-gold)' : '#c8b8a2'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
