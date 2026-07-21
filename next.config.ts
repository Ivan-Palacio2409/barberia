// ============================================================
// next.config.ts — Fase 29
// Headers de seguridad, Content Security Policy, compresión,
// optimización de imágenes y configuración de producción.
// ============================================================

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ── Indicador de desarrollo (el botón "N" flotante) ──────────
  // Solo aparece en `next dev`, nunca en producción. Se apaga
  // porque estorbaba visualmente mientras se revisaba el sitio.
  devIndicators: false,

  // ── Compresión ───────────────────────────────────────────────
  compress: true,

  // ── Optimización de imágenes ─────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    deviceSizes: [390, 640, 768, 1024, 1280, 1920],
    imageSizes: [16, 32, 64, 128, 256],
  },

  // ── Headers de seguridad ─────────────────────────────────────
  async headers() {
    const headers = [
      // Aplica a todas las rutas
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
      },
      // Content-Security-Policy: se genera dinámicamente en
      // middleware.ts (con nonce por request) — ver el comentario
      // ahí. No se define acá para evitar dos headers CSP
      // compitiendo (el navegador los intersecta, lo que puede
      // dar resultados confusos e impredecibles).
    ]

    return [
      {
        source: '/(.*)',
        headers,
      },
      // Cache largo para assets estáticos (inmutables)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache para el manifest y el SW
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Cache para íconos
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ── Rutas de redirección ──────────────────────────────────────
  async redirects() {
    return [
      // Alias corto para reservar
      {
        source: '/booking',
        destination: '/reservar',
        permanent: true,
      },
      {
        source: '/cita',
        destination: '/reservar',
        permanent: true,
      },
    ]
  },

  // ── Experimental ─────────────────────────────────────────────
  experimental: {
    // Optimiza el tree-shaking de paquetes de UI
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
  },
}

export default nextConfig