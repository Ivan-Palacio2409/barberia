// ============================================================
// src/app/api/disponibilidad/route.ts — Fase 30 (corregido)
// Ruta publica protegida con rate limiting.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { getFechasDisponibles } from '@/services/disponibilidad'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  // Rate limiting por IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
  const { allowed, remaining } = checkRateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const duracion = Number(req.nextUrl.searchParams.get('duracion') ?? '0')

  if (!duracion || duracion < 1 || duracion > 480) {
    return NextResponse.json([], { status: 200 })
  }

  try {
    const fechas = await getFechasDisponibles(duracion)
    return NextResponse.json(fechas, {
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
