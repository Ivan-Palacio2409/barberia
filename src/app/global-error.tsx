'use client'

// ============================================================
// src/app/global-error.tsx
// Auditoría enterprise (Revisión 6 — disponibilidad): error.tsx
// NO cubre errores lanzados dentro de layout.tsx (ej. si
// validateEnv() lanzara en el cliente, o falla la carga de
// fuentes). Next.js exige un archivo separado para ese caso, y
// exige que reemplace <html>/<body> por completo porque el
// layout raíz que falló ya no está disponible. Se evita
// deliberadamente cualquier dependencia de globals.css/fonts acá
// por si el problema es justamente ahí.
// ============================================================

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('[GlobalError]', error.message, { digest: error.digest, stack: error.stack })
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: '#fdf7f5',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 380 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3a2e2e' }}>
              La aplicación tuvo un error crítico
            </h1>
            <p style={{ marginTop: 8, color: '#7a6d6d', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Estamos trabajando para solucionarlo. Intentá recargar la página.
            </p>
            {error.digest && (
              <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#a89a9a' }}>
                Código de referencia: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#fff',
                background: '#292421',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Recargar
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
