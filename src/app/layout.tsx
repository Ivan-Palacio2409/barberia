// ============================================================
// src/app/layout.tsx — Fase 29
// Layout raiz con metadatos completos para PWA y SEO.
// Incluye manifest, theme-color, viewport y apple-touch-icon.
// ============================================================

import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { validateEnv } from '@/lib/env'

// Validar variables de entorno en startup — falla rapido si falta alguna
if (process.env.NODE_ENV !== 'test') validateEnv()

import { PWAUpdateToast } from '@/components/shared/PWAUpdateToast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import './globals.css'

// ── Tipografía de marca — sistema "Aureum & Onyx" (DESIGN.md) ──
// Playfair Display: serif editorial de herencia clásica (titulares).
// Inter: sans-serif de precisión suiza, muy legible en fondos oscuros.
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

// ── Viewport separado (Next.js 14+ requiere export independiente) ─
export const viewport: Viewport = {
  themeColor: '#1C1A17',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// ── Metadatos globales ────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barberia-peluqueria.vercel.app'
  ),
  title: {
    default: 'BARBERÍA — Peluquería',
    template: '%s | BARBERÍA',
  },
  description:
    'Reserva tu cita de peluquería de forma fácil y rápida. Cortes, barba, color y tratamientos capilares con un solo estilista, en Colombia.',
  keywords: [
    'peluquería',
    'barbería',
    'corte de cabello',
    'corte de barba',
    'tintura',
    'tratamiento capilar',
    'reservas online',
    'BARBERÍA',
    'peluquero',
  ],
  authors: [{ name: 'BARBERÍA' }],
  creator: 'BARBERÍA',
  publisher: 'BARBERÍA',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // ── Open Graph ───────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'BARBERÍA',
    title: 'BARBERÍA — Peluquería',
    description:
      'Reserva tu cita de peluquería en minutos. Cortes, barba, color y tratamientos capilares.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BARBERÍA — Peluquería',
      },
    ],
  },
  // ── Twitter / X ──────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'BARBERÍA — Peluquería',
    description:
      'Reserva tu cita de peluquería en minutos. Cortes, barba, color y tratamientos capilares.',
    images: ['/og-image.png'],
  },
  // ── PWA / Manifest ───────────────────────────────────────────
  manifest: '/manifest.webmanifest',
  // ── Apple (PWA en iOS) ───────────────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BARBERÍA',
  },
  // ── Iconos ───────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon.ico',
  },
}

// ── Layout ───────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${playfairDisplay.variable} ${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <PWAUpdateToast />
      </body>
    </html>
  )
}