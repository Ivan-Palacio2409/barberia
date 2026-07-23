'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/lib/validations'

// ============================================================
// /login — Fase 7
// Auditoría fase 30: antes tenía un esquema local propio que
// exigía contraseña de 6+ caracteres, distinto del esquema
// centralizado (que solo exige "no vacía", correcto para login:
// la política de complejidad se valida en el registro, no aquí).
// ============================================================

const schema = loginSchema

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { signIn, signInWithGoogle, resendConfirmation, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const oauthError = searchParams.get('error') === 'oauth'

  const [serverError, setServerError] = useState<string | null>(
    oauthError ? 'Error al autenticar con Google. Intenta de nuevo.' : null
  )
  const [submitting, setSubmitting] = useState(false)
  const [correoSinConfirmar, setCorreoSinConfirmar] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && user) router.replace(redirect)
  }, [user, loading, router, redirect])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setServerError(null)
    setCorreoSinConfirmar(null)
    setReenviado(false)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      // QA: Supabase devuelve "Email not confirmed" cuando la cuenta
      // existe pero todavía no se confirmó el correo de registro.
      // Antes esto se mostraba igual que credenciales inválidas,
      // así que alguien que acababa de registrarse y entraba con
      // los datos EXACTOS que puso veía "correo o contraseña
      // incorrectos" — muy confuso. Ahora se distingue y se ofrece
      // reenviar el correo de confirmación.
      if (error.toLowerCase().includes('confirm')) {
        setCorreoSinConfirmar(values.email)
        setServerError('Tu cuenta existe, pero falta confirmar tu correo. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace que te enviamos.')
      } else {
        setServerError('Correo o contraseña incorrectos.')
      }
      setSubmitting(false)
    }
    // Si no hay error, onAuthStateChange redirige automáticamente
  }

  const handleReenviar = async () => {
    if (!correoSinConfirmar) return
    setReenviando(true)
    const { error } = await resendConfirmation(correoSinConfirmar)
    setReenviando(false)
    if (!error) setReenviado(true)
  }

  const handleGoogle = async () => {
    setServerError(null)
    const { error } = await signInWithGoogle()
    if (error) setServerError('No se pudo iniciar con Google. Intenta de nuevo.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / título */}
        <div className="text-center">
          <h1 className="font-playfair text-3xl font-semibold text-gray-800">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Accede a tu cuenta para gestionar tus citas
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Error global */}
          {serverError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 space-y-2">
              <p>{serverError}</p>
              {correoSinConfirmar && !reenviado && (
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={reenviando}
                  className="text-xs font-medium text-primary underline hover:no-underline disabled:opacity-60"
                >
                  {reenviando ? 'Reenviando...' : 'Reenviar correo de confirmación'}
                </button>
              )}
              {reenviado && (
                <p className="text-xs text-green-700">Te reenviamos el correo. Revisa tu bandeja de entrada.</p>
              )}
            </div>
          )}

          {/* Email */}
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

          {/* Contraseña */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Link
                href="/recuperar-contrasena"
                className="text-xs text-primary hover:underline"
              >
                Olvidé mi contraseña
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Separador */}
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">o continúa con</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <GoogleSvg />
          Continuar con Google
        </button>

        {/* Registro */}
        <p className="text-center text-sm text-gray-500">
          No tienes cuenta?{' '}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  )
}

function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}