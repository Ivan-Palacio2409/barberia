'use client'

import { useState, useRef, useCallback } from 'react'
import { useReserva } from '@/hooks/useReserva'
import { validateFile, ALLOWED_TYPES } from '@/lib/supabase/storage'

interface Props {
  onNext: () => void
  onBack: () => void
}

// ── Iconos SVG ────────────────────────────────────────────────
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

const MAX_FOTOS = 5

export function ReservaStep5Fotos({ onNext, onBack }: Props) {
  const {
    fotosReferencia,
    notasAdicionales,
    addFoto,
    removeFoto,
    setNotas,
    setConsentimientoFotos,
    consentimientoFotos,
  } = useReserva()

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [previews, setPreviews] = useState<string[]>([])

  function handleConsentimiento(checked: boolean) {
    setConsentimientoFotos(checked)
  }

  const handleFile = useCallback(
    (file: File) => {
      setErrorArchivo(null)
      const err = validateFile(file)
      if (err) { setErrorArchivo(err); return }
      if (fotosReferencia.length >= MAX_FOTOS) {
        setErrorArchivo(`Máximo ${MAX_FOTOS} imágenes permitidas.`)
        return
      }
      addFoto(file)
      // Generar preview local
      const url = URL.createObjectURL(file)
      setPreviews((prev) => [...prev, url])
    },
    [fotosReferencia.length, addFoto],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (!consentimientoFotos) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [consentimientoFotos, handleFile],
  )

  function eliminarFoto(index: number) {
    removeFoto(index)
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleOmitir() {
    // Si omite, limpiar cualquier foto que pudiera haber
    // y avanzar sin registrar consentimiento de fotos
    onNext()
  }

  const uploadDisabled = !consentimientoFotos

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2
          className="font-display text-2xl font-semibold mb-1"
          style={{ color: 'var(--pub-text)' }}
        >
          Fotos de referencia
        </h2>
        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
          Opcional — comparte hasta {MAX_FOTOS} imágenes para orientar a la estilista.
        </p>
      </div>

      {/* [C8] Consentimiento de almacenamiento de fotografías */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: 'rgba(245, 245, 245,0.06)',
          border: '1px solid rgba(245, 245, 245,0.18)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="consentimientoFotos"
              type="checkbox"
              checked={consentimientoFotos}
              onChange={(e) => handleConsentimiento(e.target.checked)}
              className="w-4 h-4 rounded border"
              style={{ accentColor: 'var(--pub-gold)' }}
            />
          </div>
          <label
            htmlFor="consentimientoFotos"
            className="text-sm"
            style={{ color: 'var(--pub-text)' }}
          >
            Autorizo el almacenamiento de mis fotografías de referencia para uso
            exclusivo en la preparación de mi cita. Puedo solicitar su eliminación
            en cualquier momento desde mi perfil.
          </label>
        </div>

        <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--pub-text-muted)' }}>
          <IconShield />
          Las fotos se conservarán durante 12 meses o hasta que solicites su eliminación.
          (Ley 1581/2012)
        </p>

        {!consentimientoFotos && (
          <p className="text-xs" style={{ color: 'var(--pub-text-muted)' }}>
            Acepta para habilitar la carga de imágenes. Si prefieres no compartir fotos,
            usa el botón &ldquo;Omitir este paso&rdquo;.
          </p>
        )}
      </div>

      {/* Zona de upload */}
      <div
        role="button"
        tabIndex={uploadDisabled ? -1 : 0}
        aria-disabled={uploadDisabled}
        onDragOver={(e) => { e.preventDefault(); if (!uploadDisabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => { if (!uploadDisabled) inputRef.current?.click() }}
        onKeyDown={(e) => {
          if (!uploadDisabled && (e.key === 'Enter' || e.key === ' '))
            inputRef.current?.click()
        }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 text-center transition-all duration-200"
        style={{
          borderColor: dragging
            ? 'var(--pub-gold)'
            : uploadDisabled
            ? 'rgba(245, 245, 245,0.15)'
            : 'rgba(245, 245, 245,0.35)',
          background: dragging
            ? 'rgba(245, 245, 245,0.08)'
            : uploadDisabled
            ? 'rgba(245, 245, 245,0.03)'
            : 'rgba(245, 245, 245,0.04)',
          cursor: uploadDisabled ? 'not-allowed' : 'pointer',
          opacity: uploadDisabled ? 0.5 : 1,
        }}
      >
        <span style={{ color: uploadDisabled ? 'rgba(245, 245, 245,0.4)' : 'var(--pub-gold)' }}>
          <IconUpload />
        </span>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: uploadDisabled ? 'var(--pub-text-muted)' : 'var(--pub-text)' }}
          >
            {uploadDisabled
              ? 'Acepta el consentimiento para habilitar la carga'
              : 'Arrastra una imagen o haz clic aquí'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--pub-text-muted)' }}>
            JPEG, PNG o WebP · Máx. 5 MB · {fotosReferencia.length}/{MAX_FOTOS} imágenes
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        disabled={uploadDisabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {errorArchivo && (
        <p className="text-xs" style={{ color: '#dc2626' }} role="alert">
          {errorArchivo}
        </p>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {previews.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto de referencia ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => eliminarFoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                aria-label={`Eliminar foto ${i + 1}`}
              >
                <IconX />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notas adicionales */}
      <div className="space-y-1">
        <label
          htmlFor="notas"
          className="block text-sm font-medium"
          style={{ color: 'var(--pub-text)' }}
        >
          Notas para la estilista
          <span className="ml-1 text-xs font-normal" style={{ color: 'var(--pub-text-muted)' }}>
            (opcional)
          </span>
        </label>
        <textarea
          id="notas"
          value={notasAdicionales}
          onChange={(e) => setNotas(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Describe el diseño que tienes en mente, colores preferidos, alergias conocidas..."
          className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none transition-all duration-200 focus:ring-2"
          style={{
            borderColor: 'rgba(245, 245, 245,0.3)',
            background: 'rgba(245, 245, 245,0.04)',
            color: 'var(--pub-text)',
          }}
        />
        <p className="text-right text-xs" style={{ color: 'var(--pub-text-muted)' }}>
          {notasAdicionales.length}/500
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border transition-all duration-200"
          style={{ borderColor: 'rgba(245, 245, 245,0.3)', color: 'var(--pub-text-muted)' }}
        >
          <IconArrowLeft />
          Atras
        </button>

        <button
          type="button"
          onClick={handleOmitir}
          className="px-5 py-2.5 rounded-full text-sm border transition-all duration-200"
          style={{ borderColor: 'rgba(245, 245, 245,0.3)', color: 'var(--pub-text-muted)' }}
        >
          Omitir este paso
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex-1 sm:flex-none sm:ml-auto px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
            color: 'var(--pub-on-gold)',
            boxShadow: '0 2px 12px rgba(245, 245, 245,0.3)',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
