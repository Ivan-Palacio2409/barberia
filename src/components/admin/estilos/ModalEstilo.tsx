'use client'

// ============================================================
// ModalEstilo.tsx — Fase 20 (simplificado)
// Modal para crear y editar diseños del catálogo público.
// Solo imagen + título + destacado: sin categoría ni precio de
// referencia, a pedido — la galería pública ya no los usa.
// ============================================================

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CatalogoEstilo } from '@/types'
import { crearEstiloAdmin, actualizarEstiloAdmin } from '@/services/catalogo'
import { uploadImage, generateFilePath, BUCKETS, deleteImage } from '@/lib/supabase/storage'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ImageUpload } from '@/components/forms/ImageUpload'

const schema = z.object({
  titulo:    z.string().min(2, 'Mínimo 2 caracteres').max(100),
  destacado: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

interface Props {
  estilo?: CatalogoEstilo | null
  onClose: () => void
  onSaved: () => void
}

export function ModalEstilo({ estilo, onClose, onSaved }: Props) {
  const isEditing = !!estilo
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(estilo?.imagen_url ?? null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo:    estilo?.titulo    ?? '',
      destacado: estilo?.destacado ?? false,
    },
  })

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError(null)

    let rutaSubida: string | null = null

    try {
      let imagen_url = estilo?.imagen_url ?? ''

      if (!imagen_url && !imageFile) {
        throw new Error('Debes subir una imagen para el diseño.')
      }

      if (imageFile) {
        if (isEditing && estilo!.imagen_url) {
          // Intentar borrar imagen anterior (no crítico)
          try {
            const oldPath = new URL(estilo!.imagen_url).pathname.split('/').slice(-2).join('/')
            await deleteImage(BUCKETS.CATALOGO, oldPath)
          } catch {}
        }
        const path = generateFilePath('catalogo', imageFile)
        imagen_url = await uploadImage(BUCKETS.CATALOGO, imageFile, path)
        rutaSubida = path
      }

      const payload = { ...values, imagen_url }
      let ok = false

      if (isEditing) {
        const updated = await actualizarEstiloAdmin(estilo!.id, payload)
        ok = !!updated
      } else {
        const created = await crearEstiloAdmin(payload as Omit<CatalogoEstilo, 'id' | 'categoria'>)
        ok = !!created
      }

      if (!ok) throw new Error('No se pudo guardar el diseño. Intenta de nuevo.')
      onSaved()
    } catch (err: unknown) {
      // Auditoría enterprise (Revisión 7 — storage): si la imagen ya
      // se subió pero el guardado del diseño falló después, no dejar
      // el archivo huérfano en el bucket.
      if (rutaSubida) {
        deleteImage(BUCKETS.CATALOGO, rutaSubida).catch(() => {})
      }
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isEditing ? 'Editar diseño' : 'Nuevo diseño'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">

          {/* Imagen */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              Imagen del diseño {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            {imagePreview ? (
              <div className="relative h-48 w-full rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <ImageUpload onFileSelected={(f) => setImageFile(f)} maxFiles={1} currentCount={0} />
            )}
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo" className="text-foreground">Título</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Ej: Fade clásico con línea de barba" />
            {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
          </div>

          {/* Destacado */}
          <div className="flex items-center gap-3">
            <input
              id="destacado"
              type="checkbox"
              {...register('destacado')}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="destacado" className="font-normal cursor-pointer text-foreground">
              Marcar como diseño destacado (aparece primero en la galería)
            </Label>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit(onSubmit)}>
            {loading ? <LoadingSpinner size="sm" /> : isEditing ? 'Guardar cambios' : 'Crear diseño'}
          </Button>
        </div>
      </div>
    </div>
  )
}