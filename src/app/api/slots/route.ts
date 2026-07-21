// ============================================================
// src/app/api/slots/route.ts — Fase 30 (corregido)
// Ruta publica protegida con rate limiting y validacion de inputs.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { getSlotsDisponibles } from '@/services/disponibilidad'
import { checkRateLimit } from '@/lib/rate-limit'

// Regex simple para validar formato YYYY-MM-DD
const FECHA_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
  const { allowed, remaining } = checkRateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const fecha    = req.nextUrl.searchParams.get('fecha') ?? ''
  const duracion = Number(req.nextUrl.searchParams.get('duracion') ?? '0')

  if (!fecha || !FECHA_REGEX.test(fecha) || !duracion || duracion < 1 || duracion > 480) {
    return NextResponse.json([], { status: 200 })
  }

  try {
    const slots = await getSlotsDisponibles(fecha, duracion)
    return NextResponse.json(slots, {
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
