'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants'
import { ShaderBackground } from '@/components/public/ShaderBackground'

// ============================================================
// HeroSectionMobile.tsx
//
// Versión del hero SOLO para móvil/tablet chico (< 1024px, por
// debajo del breakpoint "lg" de Tailwind). Se renderiza siempre en
// el DOM pero se oculta con `flex lg:hidden` — su hermano
// HeroSectionDesktop.tsx hace lo inverso (`hidden lg:flex`), así
// solo hay UN árbol visible a la vez y ajustar este archivo no
// puede romper el de escritorio.
//
// FOTO PLACEHOLDER: reemplaza BARBER_PHOTO_URL por la foto real
// (Supabase Storage o /public).
// ============================================================

const BARBER_PHOTO_URL =
  'public/Hero.png'

export function HeroSectionMobile() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLParagraphElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    // Curva de aceleración: arranca suave y acelera hacia el final,
    // para que el movimiento se sienta más intencional/dramático.
    const easeInCubic = (t: number) => t * t * t

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          const section = sectionRef.current
          if (!section) return
          const rect = section.getBoundingClientRect()
          // Se completa al 78% del alto de la sección para que todo
          // haya desaparecido justo antes de terminar de pasar el scroll.
          const raw = Math.min(Math.max(-rect.top / (rect.height * 0.78), 0), 1)
          const p = easeInCubic(raw)

          if (titleRef.current) {
            titleRef.current.style.transform = `translate(${-p * 170}px, ${-p * 30}px) scale(${1 - p * 0.08})`
            titleRef.current.style.opacity = `${Math.max(0, 1 - p * 1.3)}`
          }
          if (wordmarkRef.current) {
            wordmarkRef.current.style.transform = `translateX(${p * 220}px) scale(${1 + p * 0.12})`
            wordmarkRef.current.style.opacity = `${Math.max(0, 1 - p * 1.3)}`
            wordmarkRef.current.style.filter = `blur(${p * 6}px)`
          }
          if (photoRef.current) {
            photoRef.current.style.transform = `translateY(${p * 130}px) scale(${1 - p * 0.22})`
            photoRef.current.style.opacity = `${Math.max(0, 1 - p * 1.2)}`
          }
          if (buttonRef.current) {
            buttonRef.current.style.transform = `translate(${-p * 110}px, ${p * 40}px) scale(${1 - p * 0.1})`
            buttonRef.current.style.opacity = `${Math.max(0, 1 - p * 1.4)}`
          }
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="flex lg:hidden flex-col relative min-h-[100dvh] items-center justify-start overflow-hidden text-center"
      aria-label="Bienvenida"
      style={{ background: 'var(--pub-bg)' }}
    >
      {/* Fondo animado en WebGL — humo dorado sutil reactivo al mouse */}
      <ShaderBackground />

      {/* Resplandor rojo/dorado ambiental */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 78%, rgba(154,74,62,0.35) 0%, transparent 65%), ' +
            'radial-gradient(ellipse 60% 40% at 18% 90%, rgba(154,74,62,0.28) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 60% 40% at 82% 90%, rgba(154,74,62,0.28) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 50% 35% at 50% 30%, rgba(233,193,118,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Degradado inferior para fundir el hero con la sección siguiente */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 z-10"
        style={{ background: 'linear-gradient(to top, var(--pub-bg) 0%, transparent 100%)' }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-28 w-full flex-1 flex flex-col items-center">
        {/* Nombre de marca + subtítulo */}
        <div ref={titleRef} className="flex flex-col items-center will-change-transform">
          <h1
            className="font-display text-5xl font-semibold leading-[1.05]"
            style={{ color: 'var(--pub-gold-strong)' }}
          >
            BARBERÍA
          </h1>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span aria-hidden="true" className="h-px w-4 pub-barberpole shrink-0" />
            <p
              className="text-[0.55rem] font-semibold uppercase tracking-[0.12em] whitespace-nowrap"
              style={{ color: 'var(--pub-text-muted)' }}
            >
              El arte de la peluquería clásica
            </p>
            <span aria-hidden="true" className="h-px w-4 pub-barberpole shrink-0" />
          </div>
        </div>

        {/* Bloque gráfico: wordmark gigante + retrato superpuesto */}
        <div className="relative w-full mt-10 flex flex-col items-center">
          <div
            className="flex w-screen justify-center overflow-hidden px-1"
            style={{ marginLeft: 'calc(50% - 50vw)' }}
          >
            <p
              ref={wordmarkRef}
              aria-hidden="true"
              className="font-display select-none leading-[0.82] tracking-tight text-center text-[clamp(2.6rem,14.5vw,7rem)] will-change-transform"
              style={{
                color: 'var(--pub-gold-strong)',
                fontWeight: 700,
                opacity: 0.92,
                whiteSpace: 'nowrap',
              }}
            >
              PELUQUERÍA
            </p>
          </div>

          {/* Retrato del barbero, superpuesto sobre el wordmark */}
          <div
            ref={photoRef}
            className="relative mx-auto -mt-[9vw] w-[64%] max-w-[260px] shrink-0 will-change-transform"
            style={{ aspectRatio: '3 / 4.3' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BARBER_PHOTO_URL}
              alt="Barbero de BARBERÍA posando en el estudio"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                filter: 'grayscale(0.55) contrast(1.08) brightness(0.92)',
                maskImage:
                  'radial-gradient(ellipse 58% 62% at 50% 36%, black 40%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.18) 82%, transparent 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 58% 62% at 50% 36%, black 40%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.18) 82%, transparent 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(12,15,15,0.65) 0%, rgba(154,74,62,0.18) 45%, transparent 75%)',
                mixBlendMode: 'multiply',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
              style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--pub-bg) 92%)' }}
            />
          </div>
        </div>
      </div>

      {/* Botón de reserva — anclado al pie de la sección, sin espacio sobrante debajo */}
      <div
        ref={buttonRef}
        className="relative z-10 mt-auto mb-8 flex justify-center w-full will-change-transform"
      >
        <Link
          href={ROUTES.reservar}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold uppercase tracking-[0.12em] shadow-lg transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
            color: 'var(--pub-on-gold)',
            boxShadow: '0 10px 30px rgba(233,193,118,0.35)',
          }}
        >
          Reservar experiencia
        </Link>
      </div>
    </section>
  )
}