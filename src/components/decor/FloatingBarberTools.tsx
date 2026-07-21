'use client'

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

// ============================================================
// FloatingBarberTools.tsx
//
// Capa decorativa para el sitio público: iconos de herramientas
// de barbería (tijeras, máquina, peinilla, navaja) que flotan
// suavemente solos (CSS) y que el usuario puede arrastrar con el
// mouse o el dedo. Es puramente decorativo (aria-hidden) — no
// afecta el layout del resto de la página, vive en una capa
// absoluta encima o detrás del contenido según z-index.
//
// Sin dependencias externas: el arrastre se hace con Pointer
// Events nativos + una transformación CSS (translate).
// ============================================================

interface Tool {
  id: string
  icon: React.ReactNode
  top: string
  left: string
  size: number
  floatClass: string
  rotate: number
  color: 'gold' | 'red' | 'text'
  opacity?: number
  hideOnMobile?: boolean
}

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="34" r="5.5" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="14" r="5.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16.5 17 L42 40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16.5 31 L42 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="29" cy="24" r="1.6" fill="currentColor" />
    </svg>
  )
}

function ClipperIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="6" width="14" height="24" rx="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M17 6 L17 2 M25 6 L25 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 30 L11 42 L31 42 L28 30 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M19 12 h4 M19 17 h4 M19 22 h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CombIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12 h32 v6 h-32 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={i}
          x1={10 + i * 3.6}
          y1="18"
          x2={10 + i * 3.6}
          y2="38"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function RazorIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 30 L26 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 10 L42 10 L42 18 L30 18 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M6 30 L14 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function MustacheIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 20c-1.6-3-5-5.5-9-5.5-5 0-9 3-9 7 0 3 2.3 4.8 5 4.8 2.6 0 4-1.6 4-3.4 0-1.2-.8-2-1.8-2-.7 0-1.2.4-1.2 1"
        stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M24 20c1.6-3 5-5.5 9-5.5 5 0 9 3 9 7 0 3-2.3 4.8-5 4.8-2.6 0-4-1.6-4-3.4 0-1.2.8-2 1.8-2 .7 0 1.2.4 1.2 1"
        stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function SprayBottleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="18" width="14" height="22" rx="2.5" stroke="currentColor" strokeWidth="2.1" />
      <path d="M18 18 V12 h4 v-3" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="7" width="10" height="5" rx="1.5" stroke="currentColor" strokeWidth="2.1" />
      <path d="M32 10 L36 8 M33 13 L38 13 M32 16 L36 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M18 25 h6 M18 30 h6 M18 35 h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const TOOLS: Tool[] = [
  { id: 'tijeras',  icon: <ScissorsIcon />,    top: '12%', left: '84%', size: 58, floatClass: 'pub-animate-float-a', rotate: -18, color: 'gold' },
  { id: 'maquina',  icon: <ClipperIcon />,     top: '60%', left: '90%', size: 62, floatClass: 'pub-animate-float-b', rotate: 10,  color: 'text', hideOnMobile: true },
  { id: 'peinilla', icon: <CombIcon />,        top: '80%', left: '8%',  size: 54, floatClass: 'pub-animate-float-a', rotate: 8,   color: 'gold', hideOnMobile: true },
  { id: 'navaja',   icon: <RazorIcon />,       top: '18%', left: '4%',  size: 46, floatClass: 'pub-animate-float-b', rotate: -6,  color: 'red' },
  { id: 'bigote-1', icon: <MustacheIcon />,    top: '38%', left: '92%', size: 44, floatClass: 'pub-animate-float-b', rotate: 4,   color: 'gold', hideOnMobile: true },
  { id: 'bigote-2', icon: <MustacheIcon />,    top: '90%', left: '46%', size: 40, floatClass: 'pub-animate-float-a', rotate: -10, color: 'text', hideOnMobile: true },
  { id: 'spray',    icon: <SprayBottleIcon />, top: '6%',  left: '38%', size: 42, floatClass: 'pub-animate-float-a', rotate: 12,  color: 'text', hideOnMobile: true },
]

const COLOR_MAP: Record<Tool['color'], string> = {
  gold: 'var(--pub-gold)',
  red: 'var(--pub-red)',
  text: 'var(--pub-text-muted)',
}

function DraggableTool({ tool }: { tool: Tool }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const start = useRef({ x: 0, y: 0, px: 0, py: 0 })

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    start.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY }
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setPos({
      x: start.current.x + (e.clientX - start.current.px),
      y: start.current.y + (e.clientY - start.current.py),
    })
  }

  const endDrag = () => setDragging(false)

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      data-dragging={dragging}
      className={`pub-tool absolute select-none ${tool.hideOnMobile ? 'hidden sm:block' : ''} ${dragging ? '' : tool.floatClass}`}
      style={{
        top: tool.top,
        left: tool.left,
        width: tool.size,
        height: tool.size,
        color: COLOR_MAP[tool.color],
        opacity: tool.opacity ?? 0.65,
        // @ts-expect-error variable custom usada por el keyframe
        '--rot': `${tool.rotate}deg`,
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${tool.rotate}deg)`,
      }}
    >
      {tool.icon}
    </div>
  )
}

interface Props {
  /** Reduce a la mitad de herramientas (útil en secciones más pequeñas que el hero) */
  compact?: boolean
  className?: string
}

export function FloatingBarberTools({ compact = false, className = '' }: Props) {
  const tools = compact ? TOOLS.slice(0, 2) : TOOLS

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Cada herramienta habilita sus propios eventos de puntero (arrastrable);
          el contenedor es pointer-events-none para no bloquear el contenido. */}
      <div className="absolute inset-0 [&>*]:pointer-events-auto">
        {tools.map((tool) => (
          <DraggableTool key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}