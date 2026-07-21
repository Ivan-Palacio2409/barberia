import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================================
// Cliente Supabase — entorno de servidor (Server Components,
// Server Actions, Route Handlers).
// ============================================================
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` puede fallar si se llama desde un Server Component.
            // Es seguro ignorarlo siempre que exista middleware.ts
            // refrescando la sesión en cada petición.
          }
        },
      },
    }
  )
}
