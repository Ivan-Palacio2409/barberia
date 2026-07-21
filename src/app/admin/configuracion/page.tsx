'use client'

// ============================================================
// /admin/configuracion — Fase 21
// Configuración general del negocio: nombre, contacto, redes,
// tiempo de descanso y política de cancelación.
// ============================================================

import { useState, useEffect } from 'react'
import type { ConfiguracionNegocio } from '@/types'
import { getConfiguracion } from '@/services/configuracion'
import { FormConfiguracionNegocio } from '@/components/admin/configuracion'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function AdminConfiguracionPage() {
  const [config,  setConfig]  = useState<ConfiguracionNegocio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConfiguracion().then((c) => {
      setConfig(c)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos generales del negocio, tiempo de descanso entre citas y política de cancelación
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : config ? (
        <FormConfiguracionNegocio
          config={config}
          onGuardado={(actualizado) => setConfig(actualizado)}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          No se pudo cargar la configuración
        </div>
      )}
    </div>
  )
}
