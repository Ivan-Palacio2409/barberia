'use client'

// ============================================================
// ImageUpload.tsx — Fase 6
// Componente drag-and-drop con validación, preview y progress.
// [C8] Se deshabilita si no existe consentimiento de fotografías.
// ============================================================

import { useRef, useState, useCallback } from 'react'
import { validateFile, MAX_FILE_SIZE, ALLOWED_TYPES } from '@/lib/supabase/storage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface ImageUploadProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  /** Mensaje visible cuando disabled=true */
  disabledMessage?: string
  maxFiles?: number
  currentCount?: number
}

export function ImageUpload({
  onFileSelected,
  disabled = false,
  disabledMessage,
  maxFiles = 5,
  currentCount = 0,
}: ImageUploadProps) {
  const inputRef     = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      const err = validateFile(file)
      if (err) { setError(err); return }
      if (currentCount >= maxFiles) {
        setError(`Máximo ${maxFiles} imágenes permitidas.`)
        return
      }
      setLoading(true)
      try {
        onFileSelected(file)
      } finally {
        setLoading(false)
      }
    },
    [onFileSelected, currentCount, maxFiles],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      {disabled && disabledMessage && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {disabledMessage}
        </p>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click() }}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50',
        ].join(' ')}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">
              Arrastra una imagen aquí o <span className="text-primary font-medium">haz clic</span>
            </p>
            <p className="text-xs text-gray-400">
              JPEG, PNG o WebP · Máx. {MAX_FILE_SIZE / 1024 / 1024} MB
              {maxFiles > 1 && ` · ${currentCount}/${maxFiles} imágenes`}
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
