'use client'

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

// ============================================================
// HeroImageShowcase.tsx
//
// Panel visual del hero: una tarjeta a la que el usuario puede
// acercar una foto del negocio (clic, arrastrar y soltar, o
// pegar con Ctrl/Cmd+V) y que responde con un ligero tilt 3D al
// mover el mouse. El marco lleva herramientas de peluquería
// (tijeras, peine, máquina, bigote) que flotan suavemente en las
// esquinas — puramente decorativo, aria-hidden.
//
// La vista previa vive solo en el navegador (no se sube a
// ningún servidor todavía): sirve para ver cómo luciría la foto
// real del negocio en el marco antes de conectarla a un origen
// definitivo.
// ============================================================

function FrameScissors() {
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

function FrameComb() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12 h32 v6 h-32 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1={10 + i * 3.6} y1="18" x2={10 + i * 3.6} y2="38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ))}
    </svg>
  )
}

function FrameClipper() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="6" width="14" height="24" rx="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M17 6 L17 2 M25 6 L25 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 30 L11 42 L31 42 L28 30 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M19 12 h4 M19 17 h4 M19 22 h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function FrameMustache() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 20c-1.6-3-5-5.5-9-5.5-5 0-9 3-9 7 0 3 2.3 4.8 5 4.8 2.6 0 4-1.6 4-3.4 0-1.2-.8-2-1.8-2-.7 0-1.2.4-1.2 1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 20c1.6-3 5-5.5 9-5.5 5 0 9 3 9 7 0 3-2.3 4.8-5 4.8-2.6 0-4-1.6-4-3.4 0-1.2.8-2 1.8-2 .7 0 1.2.4 1.2 1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  )
}

const MAX_TILT = 8

export function HeroImageShowcase() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const readFile = useCallback((file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }, [])

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -MAX_TILT * 2, y: px * MAX_TILT * 2 })
  }

  const resetTilt = () => {
    setHovering(false)
    setTilt({ x: 0, y: 0 })
  }

  return (
    <div className="relative">
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={imageUrl ? 'Cambiar la foto principal del negocio' : 'Adjuntar una foto del negocio'}
        className="pub-tilt-card relative rounded-2xl overflow-hidden aspect-[4/5] max-w-sm mx-auto pub-card cursor-pointer"
        data-hovering={hovering}
        style={{
          // @ts-expect-error variables custom usadas por pub-tilt-card
          '--tilt-x': `${tilt.x}deg`,
          '--tilt-y': `${tilt.y}deg`,
          '--tilt-scale': hovering ? 1.015 : 1,
          borderColor: dragOver ? 'var(--pub-gold)' : undefined,
        }}
        onPointerEnter={() => setHovering(true)}
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          readFile(e.dataTransfer.files?.[0])
        }}
        onPaste={(e) => {
          const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
          readFile(item?.getAsFile())
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => readFile(e.target.files?.[0])}
        />

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'var(--pub-gold-soft)', color: 'var(--pub-gold)' }}
            >
              <UploadIcon />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--pub-text)' }}>
              Sube la foto de tu negocio
            </p>
            <p className="text-xs" style={{ color: 'var(--pub-text-dim)' }}>
              Haz clic, arrastra una imagen o pégala aquí
            </p>
          </div>
        )}

        {imageUrl && (
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            style={{ background: 'rgba(11,10,9,0.55)' }}
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--pub-gold)', color: 'var(--pub-on-gold)' }}
            >
              <UploadIcon />
              Cambiar foto
            </span>
          </div>
        )}

        {/* Tarjeta de estado, estilo notificación de sistema */}
        <div
          className="absolute bottom-5 left-5 right-5 p-4 rounded-xl"
          style={{ background: 'rgba(11,10,9,0.9)', border: '1px solid var(--pub-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--pub-gold-soft)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pub-gold)" strokeWidth="2" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--pub-text)' }}>
                Cita confirmada
              </p>
              <p className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>
                Hoy, 3:00 pm — Corte + Barba premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta social proof, más discreta */}
      <div className="absolute -top-3 -left-6 px-4 py-3 rounded-xl flex items-center gap-3 pub-card">
        <div className="flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full border-2"
              style={{ borderColor: 'var(--pub-surface)', background: 'var(--pub-surface-2)' }}
            />
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--pub-text)' }}>+500 clientes</p>
          <p className="text-[11px]" style={{ color: 'var(--pub-text-dim)' }}>4.9 de calificación</p>
        </div>
      </div>

      {/* Marco decorativo — herramientas de peluquería en las esquinas */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div
          className="absolute -top-5 -right-5 pub-animate-float-a"
          style={{ width: 46, height: 46, color: 'var(--pub-gold)', opacity: 0.85, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))', ['--rot' as string]: '-14deg', transform: 'rotate(-14deg)' }}
        >
          <FrameScissors />
        </div>
        <div
          className="absolute -bottom-4 -left-6 pub-animate-float-b"
          style={{ width: 42, height: 42, color: 'var(--pub-text-muted)', opacity: 0.8, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))', ['--rot' as string]: '9deg', transform: 'rotate(9deg)' }}
        >
          <FrameComb />
        </div>
        <div
          className="absolute top-1/3 -right-7 pub-animate-float-b hidden sm:block"
          style={{ width: 40, height: 40, color: 'var(--pub-gold)', opacity: 0.75, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))', ['--rot' as string]: '12deg', transform: 'rotate(12deg)' }}
        >
          <FrameClipper />
        </div>
        <div
          className="absolute -top-6 left-10 pub-animate-float-a hidden sm:block"
          style={{ width: 34, height: 34, color: 'var(--pub-text-muted)', opacity: 0.75, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))', ['--rot' as string]: '-6deg', transform: 'rotate(-6deg)' }}
        >
          <FrameMustache />
        </div>
      </div>
    </div>
  )
}
