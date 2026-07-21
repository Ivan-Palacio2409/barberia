'use client'

import { useState } from 'react'
import type { Cliente, ListaEspera } from '@/types'
import { FormularioAutenticado } from './FormularioAutenticado'
import { FormularioInvitado } from './FormularioInvitado'
import { MisInscripciones } from './MisInscripciones'

interface ListaEsperaClientSectionProps {
  cliente: Cliente | null
  inscripciones: ListaEspera[]
  serviciosOpciones: string[]
}

export function ListaEsperaClientSection({
  cliente,
  inscripciones,
  serviciosOpciones,
}: ListaEsperaClientSectionProps) {
  const [vista, setVista] = useState<'formulario' | 'mis-solicitudes' | 'exito'>('formulario')

  function handleExito() {
    setVista('exito')
  }

  if (vista === 'exito') {
    return (
      <div className="bg-[var(--pub-surface)] rounded-2xl border border-[var(--pub-gold)]/20 p-10 text-center flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: '#FDF0F0' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pub-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--pub-text)]" style={{ fontFamily: 'var(--font-display)' }}>
            Solicitud enviada
          </h2>
          <p className="text-sm text-[var(--pub-text-muted)] mt-2 max-w-xs mx-auto">
            Te notificaremos en cuanto haya disponibilidad para la fecha que elegiste.
          </p>
        </div>
        <button
          onClick={() => setVista('formulario')}
          className="mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)]"
          style={{ background: 'var(--pub-gold)' }}
        >
          Nueva solicitud
        </button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start">
      {/* Formulario — 3 columnas */}
      <div className="lg:col-span-3">
        {/* Tabs si el cliente está autenticado y tiene inscripciones */}
        {cliente && inscripciones.length > 0 && (
          <div className="flex rounded-lg border border-[var(--pub-gold)]/30 overflow-hidden mb-6 bg-[var(--pub-surface)]">
            {[
              { key: 'formulario', label: 'Nueva solicitud' },
              { key: 'mis-solicitudes', label: `Mis solicitudes (${inscripciones.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setVista(key as typeof vista)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  vista === key
                    ? 'bg-[var(--pub-gold)] text-[var(--pub-on-gold)]'
                    : 'text-[var(--pub-text-muted)] hover:bg-[var(--pub-bg)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="bg-[var(--pub-surface)] rounded-2xl border border-[var(--pub-gold)]/20 p-6">
          {vista === 'mis-solicitudes' && cliente ? (
            <MisInscripciones inscripciones={inscripciones} />
          ) : cliente ? (
            <FormularioAutenticado
              cliente={cliente}
              serviciosOpciones={serviciosOpciones}
              onExito={handleExito}
            />
          ) : (
            <FormularioInvitado
              serviciosOpciones={serviciosOpciones}
              onExito={handleExito}
            />
          )}
        </div>
      </div>

      {/* Sidebar informativo — 2 columnas */}
      <aside className="lg:col-span-2 flex flex-col gap-4">
        {/* Cómo funciona */}
        <div className="bg-[var(--pub-surface)] rounded-2xl border border-[var(--pub-gold)]/20 p-6">
          <h2 className="font-semibold text-[var(--pub-text)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            ¿Cómo funciona?
          </h2>
          <ol className="flex flex-col gap-4">
            {[
              {
                n: '1',
                titulo: 'Deja tu solicitud',
                desc: 'Indica la fecha que te interesa y los servicios que deseas.',
              },
              {
                n: '2',
                titulo: 'Te avisamos',
                desc: 'Si se libera un cupo, te contactamos de inmediato por teléfono o correo.',
              },
              {
                n: '3',
                titulo: 'Confirma tu cita',
                desc: 'Tienes 24 horas para confirmar. Si no, pasamos al siguiente en la lista.',
              },
            ].map((paso) => (
              <li key={paso.n} className="flex gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[var(--pub-on-gold)] flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--pub-gold)' }}
                >
                  {paso.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--pub-text)]">{paso.titulo}</p>
                  <p className="text-xs text-[var(--pub-text-muted)] mt-0.5">{paso.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Consejo */}
        <div
          className="pub-glass rounded-2xl p-5 border"
          style={{ borderColor: 'rgba(197, 160, 89, 0.25)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--pub-gold-soft)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pub-gold-strong)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--pub-gold-strong)' }}>Consejo</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--pub-text-muted)' }}>
                Si eres clienta frecuente, inicia sesión para que tus datos queden guardados y
                puedas ver el estado de tus solicitudes fácilmente.
              </p>
            </div>
          </div>
        </div>

        {/* CTA login si no está autenticada */}
        {!cliente && (
          <div className="bg-[var(--pub-surface)] rounded-2xl border border-[var(--pub-gold)]/20 p-5 text-center">
            <p className="text-sm text-[var(--pub-text-muted)] mb-3">
              ¿Ya tienes cuenta? Inicia sesión para ver tus solicitudes.
            </p>
            <a
              href="/login"
              className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--pub-on-gold)]"
              style={{ background: 'var(--pub-gold)' }}
            >
              Iniciar sesión
            </a>
          </div>
        )}
      </aside>
    </div>
  )
}
