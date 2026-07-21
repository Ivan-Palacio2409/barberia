import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// /auth/callback — Fase 7
// Intercambia el code de OAuth por una sesión de Supabase.
// Después de Google OAuth, Supabase redirige aquí con ?code=...
// El trigger handle_new_user se encarga de crear profiles y
// conciliar clientes automáticamente [C1, C2].
// ============================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // next: ruta de destino post-login (opcional, viene de redirectTo)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error en el intercambio → redirigir al login con mensaje
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
