'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useReserva } from '@/hooks/useReserva'
import { useAuth } from '@/hooks/useAuth'
import { datosClienteReservaSchema } from '@/lib/validations'
import { registrarConsentimientoServidor } from '@/app/actions/consentimientos'
import { buscarPorAuthUserId, crearClienteInvitado } from '@/services/clientes'
import { ROUTES } from '@/constants'

// ── Tipos ─────────────────────────────────────────────────────
type FormValues = z.infer<typeof datosClienteReservaSchema>

interface Props {
  onNext: () => void
  onBack: () => void
}

// ── Iconos ────────────────────────────────────────────────────
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

// ── Campo de formulario ───────────────────────────────────────
function Campo({
  label,
  error,
  children,
  required,
}: {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--pub-text)' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: 'var(--pub-gold)' }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
      )}
    </div>
  )
}

const inputClass =
  'w-full h-11 rounded-xl px-4 text-sm border outline-none transition-all duration-200 focus:ring-2'
const inputStyle = {
  borderColor: 'rgba(245, 241, 234,0.3)',
  background: 'rgba(245, 241, 234,0.04)',
  color: 'var(--pub-text)',
}

// ── Componente principal ──────────────────────────────────────
export function ReservaStep4DatosCliente({ onNext, onBack }: Props) {
  const { user, profile, signInWithGoogle } = useAuth()
  const { datosCliente, setDatosCliente } = useReserva()

  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const esAutenticado = !!user

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(datosClienteReservaSchema),
    defaultValues: {
      nombre: datosCliente?.nombre ?? '',
      telefono: datosCliente?.telefono ?? '',
      email: datosCliente?.email ?? '',
      website: '',
      consentimientoDatos: undefined,
    },
  })

  const consentimientoMarcado = watch('consentimientoDatos')

  // Autocompletar con los datos del perfil (nombre, celular, correo).
  // `profile` y `user` llegan de forma asíncrona desde useAuth, así
  // que si solo se usaran como defaultValues del formulario (que solo
  // se aplican una vez, al montar), los campos quedaban vacíos —y
  // además bloqueados por el readOnly de más abajo, dando la
  // impresión de que el formulario no dejaba escribir nada. Con este
  // efecto, apenas el perfil está disponible, se rellenan los campos
  // pero se dejan editables por si el cliente quiere corregir algo.
  useEffect(() => {
    if (esAutenticado && (profile || user?.email)) {
      reset({
        nombre: profile?.nombre ?? '',
        telefono: profile?.telefono ?? '',
        email: user?.email ?? '',
        website: '',
        consentimientoDatos: undefined,
      })
    }
  }, [esAutenticado, profile, user, reset])

  async function handleLoginGoogle() {
    await signInWithGoogle()
  }

  async function onSubmit(values: FormValues) {
    // Honeypot — rechazar silenciosamente si viene relleno
    if (values.website) return

    setGuardando(true)
    setErrorGeneral(null)

    try {
      let clienteId: string | null = null

      if (esAutenticado) {
        // Escenario A — Autenticado: buscar cliente vinculado
        const clienteExistente = await buscarPorAuthUserId(user.id)
        clienteId = clienteExistente?.id ?? null
      } else {
        // Escenario B — Invitado: crear registro temporal
        const nuevoCliente = await crearClienteInvitado({
          nombre: values.nombre,
          telefono: values.telefono,
          email: values.email || undefined,
        })
        clienteId = nuevoCliente?.id ?? null
      }

      if (!clienteId) {
        setErrorGeneral('No pudimos identificar tu perfil. Intenta de nuevo.')
        return
      }

      // [C8] Registrar consentimiento de tratamiento de datos
      const resultConsentimiento = await registrarConsentimientoServidor({
        clienteId,
        tipo: 'tratamiento_datos',
      })

      if (!resultConsentimiento.ok) {
        setErrorGeneral('Error al registrar el consentimiento. Intenta de nuevo.')
        return
      }

      // Persistir datos del cliente en el estado de reserva
      setDatosCliente({
        nombre: values.nombre,
        telefono: values.telefono,
        email: values.email ?? '',
        authUserId: user?.id ?? null,
        clienteId,
      })

      onNext()
    } catch {
      setErrorGeneral('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2
          className="font-display text-2xl font-semibold mb-1"
          style={{ color: 'var(--pub-text)' }}
        >
          Tus datos
        </h2>
        <p className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>
          {esAutenticado
            ? 'Confirma tu información para continuar.'
            : 'Ingresa tus datos para apartar la cita. No necesitas crear una cuenta.'}
        </p>
      </div>

      {/* Escenario autenticado con Google — opción de conectar cuenta */}
      {!esAutenticado && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(245, 241, 234,0.2)', background: 'rgba(245, 241, 234,0.04)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--pub-text-muted)' }}>
            ¿Ya tienes una cuenta? Inicia sesión para autocompletar tus datos.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={ROUTES.login}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200"
              style={{ borderColor: 'rgba(245, 241, 234,0.3)', color: 'var(--pub-text)' }}
            >
              Iniciar sesion
            </a>
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200"
              style={{ borderColor: 'rgba(245, 241, 234,0.3)', color: 'var(--pub-text)' }}
            >
              <IconGoogle />
              Continuar con Google
            </button>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Honeypot — oculto para humanos */}
        <input
          {...register('website')}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
        />

        {/* Campos de datos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nombre completo" error={errors.nombre?.message} required>
            <input
              {...register('nombre')}
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              className={inputClass}
              style={inputStyle}
            />
          </Campo>

          <Campo label="Celular" error={errors.telefono?.message} required>
            <input
              {...register('telefono')}
              type="tel"
              autoComplete="tel"
              placeholder="3XX XXX XXXX"
              maxLength={10}
              className={inputClass}
              style={inputStyle}
            />
          </Campo>
        </div>

        <Campo
          label="Correo electrónico"
          error={errors.email?.message}
          required={esAutenticado}
        >
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="opcional"
            className={inputClass}
            style={inputStyle}
          />
          {!esAutenticado && (
            <p className="text-xs mt-1" style={{ color: 'var(--pub-text-muted)' }}>
              Si lo ingresas, te enviaremos la confirmacion de tu cita.
            </p>
          )}
        </Campo>

        {/* [C8] Consentimiento de tratamiento de datos */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: 'rgba(245, 241, 234,0.06)',
            border: '1px solid rgba(245, 241, 234,0.18)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <input
                {...register('consentimientoDatos')}
                id="consentimientoDatos"
                type="checkbox"
                className="w-4 h-4 rounded border"
                style={{ accentColor: 'var(--pub-gold)' }}
              />
            </div>
            <label htmlFor="consentimientoDatos" className="text-sm" style={{ color: 'var(--pub-text)' }}>
              Acepto el tratamiento de mis datos personales conforme a la{' '}
              <a
                href={ROUTES.privacidad}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 font-medium"
                style={{ color: 'var(--pub-gold)' }}
              >
                Politica de Privacidad
              </a>
              .{' '}
              <span style={{ color: 'var(--pub-text-muted)' }}>
                (Requerido — Ley 1581/2012)
              </span>
            </label>
          </div>

          {errors.consentimientoDatos && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#dc2626' }}>
              <IconShield />
              {errors.consentimientoDatos.message}
            </div>
          )}

          <div className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--pub-text-muted)' }}>
            <IconShield />
            <span>
              Tus datos se usan exclusivamente para gestionar tus citas. Puedes ejercer tus derechos
              ARCO en cualquier momento desde tu perfil.
            </span>
          </div>
        </div>

        {/* Error general */}
        {errorGeneral && (
          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {errorGeneral}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border transition-all duration-200"
            style={{ borderColor: 'rgba(245, 241, 234,0.3)', color: 'var(--pub-text-muted)' }}
          >
            <IconArrowLeft />
            Atras
          </button>

          <button
            type="submit"
            disabled={guardando || !consentimientoMarcado}
            className="flex-1 sm:flex-none sm:ml-auto px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              !guardando && consentimientoMarcado
                ? {
                    background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
                    color: '#171310',
                    boxShadow: '0 2px 12px rgba(245, 241, 234,0.3)',
                  }
                : {
                    background: 'rgba(245, 241, 234,0.12)',
                    color: 'var(--pub-text-muted)',
                  }
            }
          >
            {guardando ? 'Guardando...' : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  )
}