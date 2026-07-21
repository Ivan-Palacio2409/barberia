'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/services/profiles'
import { actualizarCliente } from '@/services/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile, Cliente } from '@/types'

// ── Iconos SVG ───────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

interface Props {
  profile: Profile
  cliente: Cliente | null
  onSaved?: () => void
}

export function EditarPerfilForm({ profile, cliente, onSaved }: Props) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState(profile.nombre)
  const [telefono, setTelefono] = useState(profile.telefono ?? '')

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    try {
      // Actualizar profiles
      const updatedProfile = await updateProfile(user.id, { nombre, telefono })
      if (!updatedProfile) throw new Error('No se pudo actualizar el perfil.')

      // Actualizar clientes si existe el registro
      if (cliente) {
        const updatedCliente = await actualizarCliente(cliente.id, { nombre, telefono })
        if (!updatedCliente) throw new Error('No se pudo actualizar los datos del cliente.')
      }

      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNombre(profile.nombre)
    setTelefono(profile.telefono ?? '')
    setEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Informacion personal
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            <PencilIcon />
            Editar
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre" className="text-muted-foreground text-xs uppercase tracking-wide">
            Nombre completo
          </Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={!editing}
            className="bg-muted border-border disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono" className="text-muted-foreground text-xs uppercase tracking-wide">
            Telefono
          </Label>
          <Input
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={!editing}
            placeholder="Ej: 3001234567"
            className="bg-muted border-border disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-success-dark bg-success-light border border-success/30 rounded-lg px-3 py-2">
          <CheckIcon />
          Datos actualizados correctamente.
        </div>
      )}

      {editing && (
        <div className="flex gap-3 pt-1">
          <Button onClick={handleSubmit} disabled={saving || !nombre.trim()}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}