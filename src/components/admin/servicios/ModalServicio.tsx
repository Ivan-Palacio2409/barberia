'use client'

// ============================================================
// ModalServicio.tsx — Fase 20
// Modal para crear y editar servicios del catálogo.
// ============================================================

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Servicio, CategoriaServicio } from '@/types'
import { crearServicio, actualizarServicio } from '@/services/servicios'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { uploadImage, generateFilePath, BUCKETS, deleteImage } from '@/lib/supabase/storage'
import { ImageUpload } from '@/components/forms/ImageUpload'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  descripcion: z.string().max(500).optional(),
  categoria_id: z.string().uuid('Selecciona una categoría'),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  duracion_minutos: z.coerce.number().int().min(5, 'Mínimo 5 minutos'),
  activo: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

interface Props {
  servicio?: Servicio | null
  categorias: CategoriaServicio[]
  onClose: () => void
  onSaved: () => void
}

export function ModalServicio({ servicio, categorias, onClose, onSaved }: Props) {
  const isEditing = !!servicio
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(servicio?.imagen_url ?? null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre:           servicio?.nombre           ?? '',
      descripcion:      servicio?.descripcion      ?? '',
      categoria_id:     servicio?.categoria_id     ?? '',
      precio:           servicio?.precio           ?? 0,
      duracion_minutos: servicio?.duracion_minutos ?? 60,
      activo:           servicio?.activo           ?? true,
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
      let imagen_url = servicio?.imagen_url ?? undefined

      if (imageFile) {
        const path = generateFilePath('servicios', imageFile)
        imagen_url = await uploadImage(BUCKETS.SERVICIOS, imageFile, path)
        rutaSubida = path
      }

      const payload = {
        ...values,
        ...(imagen_url ? { imagen_url } : {}),
      }

      let ok = false

      if (isEditing) {
        const updated = await actualizarServicio(servicio!.id, payload)
        ok = !!updated
      } else {
        const created = await crearServicio(payload as Omit<Servicio, 'id' | 'created_at' | 'categoria'>)
        ok = !!created
      }

      if (!ok) throw new Error('No se pudo guardar el servicio. Intenta de nuevo.')
      onSaved()
    } catch (err: unknown) {
      // Auditoría enterprise (Revisión 7 — storage): si la imagen ya
      // se subió pero el guardado del servicio falló después, no
      // dejar el archivo huérfano en el bucket.
      if (rutaSubida) {
        deleteImage(BUCKETS.SERVICIOS, rutaSubida).catch(() => {
          // Best-effort: si ni el rollback funciona, no hay más que
          // hacer acá — no bloquea mostrarle el error real al admin.
        })
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
            {isEditing ? 'Editar servicio' : 'Nuevo servicio'}
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

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del servicio</Label>
            <Input id="nombre" {...register('nombre')} placeholder="Ej: Semipermanente" />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label htmlFor="categoria_id">Categoría</Label>
            <select
              id="categoria_id"
              {...register('categoria_id')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            {errors.categoria_id && <p className="text-xs text-destructive">{errors.categoria_id.message}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea id="descripcion" {...register('descripcion')} rows={3} placeholder="Breve descripción del servicio" />
            {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
          </div>

          {/* Precio y duración */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="precio">Precio (COP)</Label>
              <Input id="precio" type="number" min="0" step="500" {...register('precio')} />
              {errors.precio && <p className="text-xs text-destructive">{errors.precio.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duracion_minutos">Duración (min)</Label>
              <Input id="duracion_minutos" type="number" min="5" step="5" {...register('duracion_minutos')} />
              {errors.duracion_minutos && <p className="text-xs text-destructive">{errors.duracion_minutos.message}</p>}
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-1.5">
            <Label>Foto del servicio <span className="text-muted-foreground">(opcional)</span></Label>
            {imagePreview && (
              <div className="relative h-32 w-full rounded-lg overflow-hidden bg-muted mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            {!imagePreview && (
              <ImageUpload onFileSelected={(f) => setImageFile(f)} maxFiles={1} currentCount={0} />
            )}
          </div>

          {/* Estado activo */}
          <div className="flex items-center gap-3">
            <input
              id="activo"
              type="checkbox"
              {...register('activo')}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="activo" className="font-normal cursor-pointer">
              Servicio activo (visible en el portal)
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
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit(onSubmit)}
          >
            {loading ? <LoadingSpinner size="sm" /> : isEditing ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </div>
    </div>
  )
}
