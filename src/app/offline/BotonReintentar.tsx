'use client'

// ============================================================
// src/app/offline/BotonReintentar.tsx
// Auditoría enterprise (Revisión 5 — resiliencia): offline/page.tsx
// es un Server Component (exporta `metadata`), pero tenía un
// onClick inline — los Server Components no pueden pasar event
// handlers a props de Client Components, y esto directamente
// rompía el build de producción entero (Next.js falla al
// pre-renderizar cualquier página con este patrón). Justo la
// página que debe funcionar sin conexión era la que tumbaba el
// build. Se separa el botón a su propio Client Component.
// ============================================================

export function BotonReintentar() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
      style={{ background: '#292421' }}
    >
      Reintentar
    </button>
  )
}
