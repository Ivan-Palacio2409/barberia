'use client'

import { useState } from 'react'
import type { ConfiguracionNegocio } from '@/types'
import { actualizarConfiguracion, getConfiguracion } from '@/services/configuracion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ============================================================
// FormConfiguracionNegocio — Fase 21
// Formulario completo para editar la configuración del negocio.
// La tabla tiene una única fila — solo se hace UPDATE.
// ============================================================

interface Props {
  config: ConfiguracionNegocio
  onGuardado: (config: ConfiguracionNegocio) => void
}

export function FormConfiguracionNegocio({ config, onGuardado }: Props) {
  const [configId,            setConfigId]            = useState(config.id)
  const [nombre,              setNombre]              = useState(config.nombre)
  const [telefono,            setTelefono]            = useState(config.telefono ?? '')
  const [instagram,           setInstagram]           = useState(config.redes_sociales?.instagram ?? '')
  const [tiktok,              setTiktok]              = useState(config.redes_sociales?.tiktok ?? '')
  const [tiempoDescanso,      setTiempoDescanso]      = useState(String(config.tiempo_descanso_min))
  const [guardando,           setGuardando]           = useState(false)
  const [guardado,            setGuardado]            = useState(false)
  const [error,               setError]               = useState('')

  const guardar = async () => {
    if (!nombre.trim()) { setError('El nombre del negocio es obligatorio'); return }
    const descansoNum = parseInt(tiempoDescanso, 10)
    if (isNaN(descansoNum) || descansoNum < 0) { setError('Tiempo de descanso inválido'); return }
    setError('')
    setGuardando(true)

    const payload: Partial<Omit<ConfiguracionNegocio, 'id' | 'updated_at'>> = {
      nombre: nombre.trim(),
      telefono:  telefono.trim()  || undefined,
      redes_sociales: {
        instagram: instagram.trim() || undefined,
        tiktok:    tiktok.trim()    || undefined,
      },
      tiempo_descanso_min:  descansoNum,
    }

    const resultado = await actualizarConfiguracion(configId, payload)
    setGuardando(false)

    if (resultado.data) {
      setConfigId(resultado.data.id)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
      onGuardado(resultado.data)
    } else {
      // Se muestra el mensaje real (ej. una política de RLS
      // bloqueando el UPDATE, o el id desactualizado) en vez de uno
      // genérico, para poder diagnosticar la causa sin tener que ir
      // a revisar la consola del navegador.
      setError(resultado.error ? `No se pudo guardar: ${resultado.error}` : 'No se pudo guardar la configuración')

      // Auto-recuperación: si el id quedó desactualizado, se trae
      // el actual para que el próximo clic en "Guardar" sí funcione
      // sin que la persona tenga que recargar la página a mano.
      const actual = await getConfiguracion()
      if (actual && actual.id !== configId) setConfigId(actual.id)
    }
  }

  return (
    <div className="space-y-6">

      {/* Datos básicos */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Datos del negocio</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del negocio</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="BARBERÍA"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono de contacto</Label>
            <Input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>
      </section>

      {/* Redes sociales */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Redes sociales</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@forma', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            )},
            { label: 'TikTok', value: tiktok, set: setTiktok, placeholder: '@forma', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.77 1.52V6.78a4.85 4.85 0 0 1-1-.09z"/>
              </svg>
            )},
          ].map(({ label, value, set, placeholder, icon }) => (
            <div key={label} className="space-y-1.5">
              <Label>{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
                <Input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="pl-9"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reservas */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Reservas</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          El pago del servicio se realiza en el local el día de la cita; el sitio solo gestiona la reserva del horario.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="descanso">Tiempo de descanso entre citas (minutos)</Label>
            <Input
              id="descanso"
              type="number"
              min="0"
              max="120"
              step="5"
              value={tiempoDescanso}
              onChange={(e) => setTiempoDescanso(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tiempo mínimo entre el fin de una cita y el inicio de la siguiente
            </p>
          </div>
        </div>
      </section>

      {/* Acciones */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3">
        {guardado && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Guardado correctamente
          </span>
        )}
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? (
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          )}
          Guardar configuración
        </Button>
      </div>
    </div>
  )
}