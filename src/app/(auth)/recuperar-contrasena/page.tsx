'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// /recuperar-contrasena — Fase 7
// ============================================================

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
})

type FormValues = z.infer<typeof schema>

export default function RecuperarContrasenaPage() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/cliente/perfil/cambiar-contrasena`,
    })
    if (error) {
      setServerError('No se pudo enviar el correo. Intenta de nuevo.')
      setSubmitting(false)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <EmailSvg />
          <h2 className="font-playfair text-2xl font-semibold text-gray-800">
            Correo enviado
          </h2>
          <p className="text-sm text-gray-500">
            Si el correo está registrado, recibirás un enlace para restablecer tu
            contraseña. Revisa también la carpeta de spam.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-primary hover:underline"
          >
            Volver al inicio de sesión
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
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa tu correo y te enviamos un enlace para restablecerla
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {serverError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Recordaste tu contraseña?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}

function EmailSvg() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="mx-auto" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="#292421" strokeWidth="1.5" />
      <path d="M2 8l10 6 10-6" stroke="#292421" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
