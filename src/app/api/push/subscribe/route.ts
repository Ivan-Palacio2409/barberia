// ============================================================
// src/app/api/push/subscribe/route.ts — Fase 30
// Endpoint para guardar / eliminar suscripciones push desde
// el cliente usando la service role key de Supabase para
// saltarse RLS cuando sea necesario desde el servidor.
// El cliente tambien puede guardar directamente via RLS (service/push.ts),
// pero este endpoint sirve como respaldo server-side.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimitDistributed } from '@/lib/rate-limit'

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'desconocida'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { allowed } = await checkRateLimitDistributed(supabase, `push-subscribe:${getIp(req)}`, {
      windowMs: 60_000,
      max: 20,
    })
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
    }

    const { cliente_id, endpoint, p256dh, auth, user_agent } = await req.json()

    if (!cliente_id || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
    }

    // Verificar que el cliente_id pertenece al usuario autenticado
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .eq('auth_user_id', user.id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('push_suscripciones')
      .upsert(
        { cliente_id, endpoint, p256dh, auth, user_agent: user_agent ?? null },
        { onConflict: 'cliente_id,endpoint' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { allowed } = await checkRateLimitDistributed(supabase, `push-unsubscribe:${getIp(req)}`, {
      windowMs: 60_000,
      max: 20,
    })
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
    }

    const { cliente_id, endpoint } = await req.json()

    if (!cliente_id || !endpoint) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
    }

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .eq('auth_user_id', user.id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('push_suscripciones')
      .delete()
      .eq('cliente_id', cliente_id)
      .eq('endpoint', endpoint)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
