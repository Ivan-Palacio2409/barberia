'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Cita, EstiloReferencia } from '@/types'

// ============================================================
// GaleriaEstilos.tsx — Fase 19
// Galería lightbox de diseños de referencia subidos por el
// cliente en citas anteriores. Usa signed URLs del bucket
// 'estilos-referencia'. Seguridad: solo admin accede (RLS).
// ============================================================

interface ImagenConCita extends EstiloReferencia {
  cita: Cita
}

interface Props {
  imagenes: ImagenConCita[]
}

export function GaleriaEstilos({ imagenes }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(false)
  const [iniciado, setIniciado] = useState(false)

  async function cargarSignedUrls() {
    if (iniciado) return
    setIniciado(true)
    setCargando(true)
    const supabase = createClient()

    const mapeadas: Record<string, string> = {}
    await Promise.all(
      imagenes.map(async (img) => {
        // Si ya es URL pública (http/https), usarla directamente
        if (img.url_imagen.startsWith('http')) {
          mapeadas[img.id] = img.url_imagen
          return
        }
        const { data } = await supabase.storage
          .from('estilos-referencia')
          .createSignedUrl(img.url_imagen, 3600)
        if (data?.signedUrl) mapeadas[img.id] = data.signedUrl
      })
    )

    setUrls(mapeadas)
    setCargando(false)
  }

  if (imagenes.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        Este cliente no tiene diseños de referencia subidos.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!iniciado && (
        <button
          onClick={cargarSignedUrls}
          className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          Cargar imagenes
        </button>
      )}

      {cargando && (
        <p className="text-sm text-muted-foreground">Generando accesos seguros...</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {imagenes.map((img) => {
          const src = urls[img.id]
          const fecha = new Date(img.cita.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
          })

          return (
            <div key={img.id} className="group relative">
              <button
                onClick={() => src && setLightbox(src)}
                disabled={!src}
                className="w-full aspect-square rounded-xl overflow-hidden border border-border bg-muted/40 block"
              >
                {src ? (
                  <img
                    src={src}
                    alt={`Estilo de referencia ${fecha}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </button>
              <p className="text-xs text-muted-foreground mt-1 text-center">{fecha}</p>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
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
            alt="Estilo de referencia ampliado"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
