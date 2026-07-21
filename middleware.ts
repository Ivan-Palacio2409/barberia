import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================
// middleware.ts — Fase 7 / Auditoría enterprise (Revisión 9 — CSP)
// Refresca la sesión en cada petición y protege rutas por rol.
//
// Reglas:
//   /admin/*   → solo profiles.rol = 'administrador'
//   /cliente/* → cualquier usuario autenticado
//   resto      → público, sin restricción
//
// CSP con nonce: antes script-src usaba 'unsafe-inline' +
// 'unsafe-eval' (next.config.ts), lo que anula gran parte del
// propósito de tener CSP — cualquier XSS inyectado igual podía
// ejecutar <script> arbitrario. Ahora se genera un nonce random
// por request acá, se manda como header x-nonce al Server
// Component (para el único <script> propio del proyecto — el
// JSON-LD de SchemaSalon en (public)/page.tsx) y se arma el header
// Content-Security-Policy final con ese nonce. Los scripts que
// Next.js inyecta para hidratación reciben este nonce
// automáticamente al detectar el patrón 'nonce-...' en el header
// (soporte nativo de Next.js desde 13.4, ver
// https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy).
//
// style-src se deja con 'unsafe-inline' a propósito: el proyecto
// usa extensivamente `style={{...}}` de React (colores dinámicos
// desde CSS vars), y auditar/hashear cada uno tiene un costo alto
// para un riesgo bajo (la ejecución de código en un XSS ocurre por
// script, no por estilos) — documentado como decisión, no como
// bug.
//
// PERF, dos ajustes (post-reporte "la página está muy lenta"):
//
// 1) Antes se ejecutaba el chequeo de sesión en TODA la app,
//    incluidas las páginas públicas (inicio, servicios, galería...)
//    que no necesitan sesión. Ahora solo corre para /admin y
//    /cliente.
//
// 2) Dentro de /admin y /cliente, antes se usaba
//    supabase.auth.getUser(), que hace un round-trip de red al
//    servidor de Auth de Supabase para revalidar el token en CADA
//    navegación. Se cambió a supabase.auth.getSession(), que lee
//    y valida el JWT localmente (firma + expiración) sin llamada
//    de red — mucho más rápido.
//
//    Trade-off de seguridad, documentado a propósito: getSession()
//    confía en la cookie tal cual llega, sin revalidar contra el
//    servidor. Esto es aceptable acá porque el middleware NUNCA es
//    la barrera de seguridad real — es solo una redirección para
//    UX (evitar que se vea el layout de /admin antes de mandar a
//    /login). La barrera real son las políticas RLS en Postgres:
//    cualquier lectura o escritura pasa por PostgREST, que sí
//    valida la firma del JWT contra el servidor en cada petición,
//    independientemente de lo que haya decidido el middleware. Si
//    alguien lograra falsificar la cookie, en el peor caso vería
//    el "cascarón" de /admin cargar por un instante — ninguna
//    consulta a datos reales pasaría, porque RLS la bloquea con el
//    mismo JWT inválido. Si en algún momento se agrega contenido
//    sensible que se renderice server-side en /admin sin pasar por
//    RLS (poco probable en este proyecto), ahí sí habría que volver
//    a getUser().
//
// 3) CAUSA REAL de la lentitud al cambiar de sección dentro de
//    /admin (ej. Horarios -> Estadísticas): aunque ya existía
//    admin/loading.tsx, este middleware corre ANTES de que Next.js
//    empiece siquiera a mostrar ese loading — y en CADA navegación
//    (no solo la primera) hacía además un
//    `supabase.from('profiles').select('rol')...`, un round-trip
//    de red a Postgres solo para confirmar un rol que casi nunca
//    cambia durante la sesión. Ese round-trip bloqueaba la
//    navegación completa (nada se pinta, ni el loading skeleton,
//    hasta que responde) — exactamente el síntoma reportado de
//    "primero llama a la BD y luego entra a la sección".
//
//    Ahora el rol se cachea en una cookie ligera (sb-role-cache)
//    atada a los primeros caracteres del access token: si el token
//    cambia (nueva sesión / logout / login de otro usuario), la
//    cache queda invalidada automáticamente. Con cookie presente y
//    coincidente, el middleware NO vuelve a consultar `profiles`
//    en cada navegación — solo la primera vez o cuando cambie la
//    sesión. Igual que con getSession(), la barrera de seguridad
//    real sigue siendo RLS en Postgres, no esta cookie.
// ============================================================

const ROLE_CACHE_COOKIE = 'sb-role-cache'

function generarNonce(): string {
  // Web Crypto está disponible en el runtime Edge de Next.js middleware.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

function construirCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://fonts.googleapis.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // NOTA: se agrega images.unsplash.com para la foto placeholder del hero
    // (ver HeroSection.tsx — BARBER_PHOTO_URL). Al reemplazarla por la foto
    // real del negocio en Supabase Storage, este dominio puede quitarse.
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join('; ')
}

export async function middleware(request: NextRequest) {
  const nonce = generarNonce()
  const pathname = request.nextUrl.pathname

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  // x-pathname: para que Server Components (ej. admin/layout.tsx) sepan
  // en qué ruta están sin necesitar usePathname() del lado del cliente.
  // Se usa para que /admin/login no herede el sidebar/navbar del panel.
  requestHeaders.set('x-pathname', pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const esLoginAdmin = pathname === '/admin/login'
  // Se incluyen /api/admin y /api/cliente: sin esto, las peticiones
  // fetch() que hace el panel (ej. guardar un horario) no pasaban
  // por el refresco de sesión de acá, y si el token ya había
  // vencido para ese momento, la Route Handler recibía una cookie
  // vieja sin nadie que la renovara antes.
  // /admin/login se excluye a propósito: es la página de login del
  // panel — si la tratáramos como protegida, alguien sin sesión
  // nunca podría verla (lo mandaríamos a /login antes de que
  // cargue, dejando /admin/login inalcanzable para quien más la
  // necesita).
  const requiereSesion =
    (pathname.startsWith('/admin') && !esLoginAdmin) ||
    pathname.startsWith('/cliente') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/cliente')

  if (requiereSesion) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request: { headers: requestHeaders } })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Validación local del JWT (sin round-trip de red) — ver nota
    // de PERF arriba sobre por qué esto es seguro en este proyecto.
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user ?? null

    // ── Rutas de admin ──────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      // Sin sesión -> al login del ADMIN, no al de clientes (/login).
      // Antes mandaba a /login, así que cerrar sesión o entrar a
      // /admin sin sesión terminaba en la pantalla equivocada.
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // El "sello" es un fragmento corto y estable del access
      // token: cambia si la sesión cambia (login/logout/otro
      // usuario), pero no en cada request de la misma sesión.
      const sello = session?.access_token?.slice(-24) ?? ''
      const cacheCookie = request.cookies.get(ROLE_CACHE_COOKIE)?.value ?? ''
      const [selloCacheado, rolCacheado] = cacheCookie.split('|')

      if (selloCacheado === sello && rolCacheado) {
        // Ya se verificó el rol para esta sesión — no repetir la
        // consulta a Postgres en cada navegación entre secciones.
        if (rolCacheado !== 'administrador') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } else {
        // Primera vez que se ve esta sesión (o cambió): sí hay que
        // consultar `profiles` una vez y guardar el resultado.
        const { data: profile } = await supabase
          .from('profiles')
          .select('rol')
          .eq('id', user.id)
          .single()

        const rol = profile?.rol ?? 'ninguno'
        response.cookies.set(ROLE_CACHE_COOKIE, `${sello}|${rol}`, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 30, // 30 min — se revalida solo si cambia la sesión antes de eso
        })

        if (rol !== 'administrador') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }

    // ── Rutas de cliente ─────────────────────────────────────────
    if (pathname.startsWith('/cliente')) {
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // ── Bloquear design-system en produccion ─────────────────
  if (pathname.startsWith('/design-system')) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  response.headers.set('Content-Security-Policy', construirCsp(nonce))
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}