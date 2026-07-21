// ============================================================
// src/app/offline/page.tsx — Fase 29
// Página de fallback cuando no hay conexión a internet.
// Servida por el service worker cuando la red falla.
// ============================================================

import { BotonReintentar } from './BotonReintentar'

export const metadata = {
  title: 'Sin conexion | BARBERÍA',
  robots: { index: false, follow: false },
}

function WifiOffIcon() {
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
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  )
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        {/* Icono */}
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: '#fae8e8', color: '#292421' }}
        >
          <WifiOffIcon />
        </div>

        {/* Texto */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Sin conexion a internet
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Parece que no tienes conexion en este momento. Verifica tu red y
            vuelve a intentarlo.
          </p>
        </div>

        {/* Accion */}
        <BotonReintentar />

        {/* Recordatorio */}
        <p className="text-xs text-muted-foreground">
          Puedes seguir viendo las paginas que visitaste recientemente sin
          conexion.
        </p>
      </div>
    </main>
  )
}
