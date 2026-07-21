// ============================================================
// src/app/not-found.tsx
// Auditoría enterprise (Revisión 6 — disponibilidad): Next.js
// muestra una 404 en blanco, sin estilo, si no existe este
// archivo. Se activa automáticamente para cualquier ruta que no
// matchea ningún segmento de la app.
// ============================================================

import Link from 'next/link'

function SearchOffIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="8" x2="14" y2="14" />
      <line x1="14" y1="8" x2="8" y2="14" />
    </svg>
  )
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: '#fae8e8', color: '#292421' }}
        >
          <SearchOffIcon />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Página no encontrada
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            La página que buscas no existe o fue movida. Revisa el enlace o
            volvé al inicio.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: '#292421' }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
