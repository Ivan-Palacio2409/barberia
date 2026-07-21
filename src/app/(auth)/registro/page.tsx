'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { registroSchema } from '@/lib/validations'

// ============================================================
// /registro — Fase 7
// Nombre, teléfono (10 dígitos colombiano), email, contraseña.
// El trigger handle_new_user crea profiles + concilia clientes.
//
// Auditoría fase 30: antes tenía un esquema local que duplicaba
// registroSchema (lib/validations). El único cambio de
// comportamiento real es el teléfono: el esquema centralizado
// (telefonoColombiano) exige que empiece por 3, como los
// celulares colombianos reales; el esquema local aceptaba
// cualquier secuencia de 10 dígitos (incluyendo fijos), lo cual
// no tiene sentido para un campo que se usa para WhatsApp/SMS.
// ============================================================

const schema = registroSchema

type FormValues = z.infer<typeof schema>

export default function RegistroPage() {
  const { signUp, signInWithGoogle } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    const { error } = await signUp(
      values.email,
      values.password,
      values.nombre,
      values.telefono
    )
    if (error) {
      setServerError('No se pudo crear la cuenta. El correo puede estar en uso.')
      setSubmitting(false)
      return
    }
    setSuccess(true)
  }

  const handleGoogle = async () => {
    setServerError(null)
    const { error } = await signInWithGoogle()
    if (error) setServerError('No se pudo iniciar con Google. Intenta de nuevo.')
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircleSvg />
          <h2 className="font-playfair text-2xl font-semibold text-gray-800">
            Cuenta creada
          </h2>
          <p className="text-sm text-gray-500">
            Te enviamos un correo de confirmación. Revisa tu bandeja de entrada y sigue
            el enlace para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-playfair text-3xl font-semibold text-gray-800">
            Crea tu cuenta
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Regístrate para reservar citas fácilmente
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {serverError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Nombre */}
          <Field label="Nombre completo" error={errors.nombre?.message}>
            <input
              type="text"
              autoComplete="name"
              placeholder="Ana García"
              className={inputClass}
              {...register('nombre')}
            />
          </Field>

          {/* Teléfono */}
          <Field label="Teléfono (10 dígitos)" error={errors.telefono?.message}>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="3001234567"
              maxLength={10}
              className={inputClass}
              {...register('telefono')}
            />
          </Field>

          {/* Email */}
          <Field label="Correo electrónico" error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className={inputClass}
              {...register('email')}
            />
          </Field>

          {/* Contraseña */}
          <Field label="Contraseña" error={errors.password?.message}>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
              {...register('password')}
            />
          </Field>

          {/* Confirmar contraseña */}
          <Field label="Confirmar contraseña" error={errors.confirmPassword?.message}>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              className={inputClass}
              {...register('confirmPassword')}
            />
          </Field>

          {/* Aviso legal */}
          <p className="text-xs text-gray-400">
            Al registrarte aceptas nuestros{' '}
            <Link href="/terminos" className="underline hover:text-gray-600" target="_blank">
              Términos y Condiciones
            </Link>{' '}
            y nuestra{' '}
            <Link href="/privacidad" className="underline hover:text-gray-600" target="_blank">
              Política de Privacidad
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">o continúa con</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <GoogleSvg />
          Continuar con Google
        </button>

        <p className="text-center text-sm text-gray-500">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}

// ── Helpers ──────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

function CheckCircleSvg() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="mx-auto" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="#292421" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" stroke="#292421" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
