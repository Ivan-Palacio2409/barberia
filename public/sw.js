// ============================================================
// public/sw.js — Fase 30: Service Worker FORMA
// Fase 29: Cache First / Network First / Network Only.
// Fase 30: Manejo de eventos push para Web Push Notifications.
//
// FIX (post-reporte "cambio de secciones lento" + "Failed to
// execute 'clone' on 'Response'"): en el handler de paginas HTML,
// response.clone() se llamaba dentro del .then() anidado de
// caches.open(), es decir, DESPUES de devolver response al
// navegador via event.respondWith(). Para ese momento el body ya
// podia estar en uso, y clone() truena con "Response body is
// already used". Esto se disparaba en CADA navegacion. clone()
// ahora se llama de forma sincrona, apenas se tiene response,
// antes de cualquier operacion async — asi el navegador y la
// cache leen cada uno su propia copia del body, sin pisarse.
// ============================================================

const CACHE_NAME = 'forma-v2'
const OFFLINE_URL = '/offline'

const STATIC_PRECACHE = [
  '/',
  '/offline',
  '/servicios',
  '/galeria',
  '/resenas',
]

// ── Instalacion ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_PRECACHE))
  )
  self.skipWaiting()
})

// ── Activacion ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  // API y Supabase: Network Only
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/auth/')
  ) {
    return
  }

  // Assets estaticos de Next.js: Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    )
    return
  }

  // Paginas HTML: Network First con fallback offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // clone() SINCRONO, antes de devolver response al
            // navegador — ver nota de FIX arriba.
            const responseParaCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseParaCache))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const offlinePage = await caches.match(OFFLINE_URL)
          return offlinePage ?? new Response('Sin conexion', { status: 503 })
        })
    )
    return
  }
})

// ── Push — Fase 30 ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'FORMA', body: event.data.text() }
  }

  const title = payload.title ?? 'FORMA'
  const options = {
    body: payload.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag ?? 'forma-notif',
    renotify: true,
    data: { url: payload.url ?? '/cliente/mis-citas' },
    actions: payload.actions ?? [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notificationclick — Fase 30 ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/cliente/mis-citas'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si ya hay una ventana abierta, enfocarla y navegar
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(url)
            return
          }
        }
        // Si no, abrir nueva ventana
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})