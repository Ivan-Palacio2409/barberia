'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EstiloReferencia } from '@/types'

// ============================================================
// GaleriaReferencia.tsx — Fase 19
// Galería compacta de imágenes de referencia en la vista de
// detalle de cita. Carga signed URLs del bucket estilos-referencia.
// ============================================================

interface Props {
  estilos: EstiloReferencia[]
}

export function GaleriaReferencia({ estilos }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [iniciado, setIniciado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  async function cargar() {
    if (iniciado) return
    setIniciado(true)
    setCargando(true)
    const supabase = createClient()

    const mapeadas: Record<string, string> = {}
    await Promise.all(
      estilos.map(async (d) => {
        if (d.url_imagen.startsWith('http')) {
          mapeadas[d.id] = d.url_imagen
          return
        }
        const { data } = await supabase.storage
          .from('estilos-referencia')
          .createSignedUrl(d.url_imagen, 3600)
        if (data?.signedUrl) mapeadas[d.id] = data.signedUrl
      })
    )

    setUrls(mapeadas)
    setCargando(false)
  }

  if (estilos.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin imagenes de referencia.</p>
  }

  return (
    <div className="space-y-3">
      {!iniciado && (
        <button
          onClick={cargar}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors font-medium"
        >
          Cargar imagenes ({estilos.length})
        </button>
      )}
      {cargando && <p className="text-xs text-muted-foreground">Cargando...</p>}
      {iniciado && !cargando && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {estilos.map((d) => {
            const src = urls[d.id]
            return (
              <button
                key={d.id}
                onClick={() => src && setLightbox(src)}
                disabled={!src}
                className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/30"
              >
                {src ? (
                  <img
                    src={src}
                    alt="Imagen de referencia"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Imagen de referencia ampliada"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
