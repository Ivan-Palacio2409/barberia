// ============================================================
// src/app/robots.ts — Fase 29
// Genera robots.txt dinámico.
// Bloquea rastreadores en rutas privadas (/admin, /cliente).
// ============================================================

import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barberia-peluqueria.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/cliente/',
          '/api/',
          '/_next/',
          '/offline',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
