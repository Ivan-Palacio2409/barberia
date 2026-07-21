import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants'

// ── Tipos internos ────────────────────────────────────────────
interface CitaResumen {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  precio_total: number | null
  cliente: { nombre: string; telefono: string } | null
  cita_servicios: Array<{
    servicio: { nombre: string; precio: number } | null
  }>
}

// ── Helper: construir URL de Google Calendar ──────────────────
function buildGoogleCalendarUrl(cita: CitaResumen): string {
  const fechaBase = cita.fecha.replaceAll('-', '')
  const horaI = cita.hora_inicio.replaceAll(':', '') + '00'
  const horaF = cita.hora_fin.replaceAll(':', '') + '00'
  const start = `${fechaBase}T${horaI}`
  const end   = `${fechaBase}T${horaF}`

  const serviciosNombre = cita.cita_servicios
    .map((cs) => cs.servicio?.nombre)
    .filter(Boolean)
    .join(', ')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Cita en la peluquería — ${serviciosNombre}`,
    dates: `${start}/${end}`,
    details: 'Cita agendada a través del portal de reservas.',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Iconos SVG ────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

// ── RSC: fetch datos de la cita ───────────────────────────────
async function getCitaConfirmada(citaId: string): Promise<CitaResumen | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('citas')
    .select(`
      id,
      fecha,
      hora_inicio,
      hora_fin,
      precio_total,
      cliente:clientes(nombre, telefono),
      cita_servicios(servicio:servicios(nombre, precio))
    `)
    .eq('id', citaId)
    .single()

  if (error || !data) return null
  return data as unknown as CitaResumen
}

// ── Página ────────────────────────────────────────────────────
export default async function ReservaConfirmadaPage({
  params,
}: {
  params: Promise<{ citaId: string }>
}) {
  const { citaId } = await params
  const cita = await getCitaConfirmada(citaId)

  if (!cita) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium" style={{ color: 'var(--pub-text)' }}>
            No se encontro la cita.
          </p>
          <Link
            href={ROUTES.home}
            className="inline-block px-6 py-2.5 rounded-full text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
              color: 'var(--pub-on-gold)',
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  const calendarUrl = buildGoogleCalendarUrl(cita)
  const serviciosNombres = cita.cita_servicios
    .map((cs) => cs.servicio?.nombre)
    .filter(Boolean)
    .join(' + ')

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8">
        {/* Icono check animado */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
              boxShadow: '0 8px 32px rgba(245, 245, 245,0.4)',
            }}
          >
            <IconCheck />
          </div>
          <div>
            <h1
              className="font-display text-3xl font-semibold"
              style={{ color: 'var(--pub-text)' }}
            >
              Reserva confirmada
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--pub-text-muted)' }}>
              Te contactaremos para confirmar los detalles finales.
            </p>
          </div>
        </div>

        {/* Tarjeta de detalle */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(245, 245, 245,0.2)' }}
        >
          {/* Header */}
          <div
            className="px-5 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 245, 245,0.1) 0%, rgba(245, 245, 245,0.05) 100%)',
              borderBottom: '1px solid rgba(245, 245, 245,0.15)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pub-gold)' }}>
              Detalle de la cita
            </p>
          </div>

          <div className="px-5 divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {/* Fecha */}
            <div className="py-3 flex justify-between items-center text-sm">
              <span style={{ color: 'var(--pub-text-muted)' }}>Fecha</span>
              <span className="font-medium text-right" style={{ color: 'var(--pub-text)', maxWidth: '60%' }}>
                {formatFecha(cita.fecha)}
              </span>
            </div>

            {/* Horario */}
            <div className="py-3 flex justify-between items-center text-sm">
              <span style={{ color: 'var(--pub-text-muted)' }}>Horario</span>
              <span className="font-medium" style={{ color: 'var(--pub-text)' }}>
                {cita.hora_inicio} — {cita.hora_fin}
              </span>
            </div>

            {/* Servicios */}
            <div className="py-3 flex justify-between items-start text-sm gap-4">
              <span className="shrink-0" style={{ color: 'var(--pub-text-muted)' }}>Servicios</span>
              <span className="font-medium text-right" style={{ color: 'var(--pub-text)' }}>
                {serviciosNombres}
              </span>
            </div>

            {/* Cliente */}
            {cita.cliente && (
              <div className="py-3 flex justify-between items-center text-sm">
                <span style={{ color: 'var(--pub-text-muted)' }}>Cliente</span>
                <span className="font-medium" style={{ color: 'var(--pub-text)' }}>
                  {cita.cliente.nombre}
                </span>
              </div>
            )}

            {/* Total */}
            {cita.precio_total != null && (
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--pub-text-muted)' }}>Total estimado</span>
                <span className="text-lg font-bold" style={{ color: 'var(--pub-gold)' }}>
                  {formatCOP(cita.precio_total)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium border transition-all duration-200"
            style={{ borderColor: 'rgba(245, 245, 245,0.3)', color: 'var(--pub-text)' }}
          >
            <IconCalendar />
            Agregar a Google Calendar
          </a>

          <Link
            href={ROUTES.clienteCitas}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, var(--pub-gold) 0%, var(--pub-gold-strong) 100%)',
              color: 'var(--pub-on-gold)',
              boxShadow: '0 2px 12px rgba(245, 245, 245,0.3)',
            }}
          >
            <IconList />
            Ver mis citas
          </Link>
        </div>

        {/* Link home */}
        <p className="text-center text-xs" style={{ color: 'var(--pub-text-muted)' }}>
          <Link href={ROUTES.home} className="underline underline-offset-2 hover:opacity-80 transition-opacity">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  )
}
