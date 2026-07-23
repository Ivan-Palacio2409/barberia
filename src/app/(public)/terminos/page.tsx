import type { Metadata } from 'next'
import Link from 'next/link'

// ============================================================
// /terminos — Fase 7 [C8]
// Términos y condiciones de uso de la plataforma.
// Accesible sin autenticación.
// ============================================================

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description:
    'Lee los términos y condiciones de uso de nuestra plataforma de reservas de servicios de belleza.',
  robots: { index: true, follow: true },
}

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      <nav aria-label="Volver" className="mb-8">
        <Link href="/" className="text-sm text-primary hover:underline">
          Volver al inicio
        </Link>
      </nav>

      <h1 className="font-playfair mb-2 text-3xl font-semibold text-gray-800">
        Términos y Condiciones
      </h1>
      <p className="mb-10 text-sm text-gray-400">
        Versión 1.1 — vigente desde la fecha de publicación
      </p>

      <Section title="1. Aceptación">
        <p>
          Al utilizar esta plataforma para reservar servicios de belleza, aceptas
          íntegramente los presentes términos. Si no estás de acuerdo con alguna
          condición, abstente de utilizar el servicio.
        </p>
      </Section>

      <Section title="2. Uso de la plataforma">
        <p>
          La plataforma está diseñada exclusivamente para gestionar reservas de servicios
          de peluquería (cortes, barba, color, tratamientos capilares y servicios
          relacionados). Queda prohibido
          el uso con fines distintos a la reserva y consulta de servicios, la
          suplantación de identidad, y cualquier actividad que perjudique el
          funcionamiento del servicio o a otros usuarios.
        </p>
      </Section>

      <Section title="3. Cuenta de usuario obligatoria">
        <p>
          Para reservar una cita es obligatorio crear una cuenta (con correo y contraseña,
          o iniciando sesión con Google). No se permiten reservas como invitado. Esto nos
          permite verificar tu identidad, protegerte de reservas hechas a tu nombre por
          terceros y permitirte ver, reagendar o cancelar tus citas desde tu perfil en
          cualquier momento.
        </p>
      </Section>

      <Section title="4. Reservas">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            Las reservas quedan confirmadas únicamente después de recibir la notificación
            de confirmación por parte del Negocio.
          </li>
          <li>
            La disponibilidad de fechas y horas mostrada en la plataforma es orientativa y
            puede cambiar hasta el momento de la confirmación.
          </li>
          <li>
            El Negocio se reserva el derecho de rechazar o cancelar una reserva en casos
            justificados, notificando al cliente con la mayor antelación posible.
          </li>
        </ul>
      </Section>

      <Section title="5. Reagendamientos">
        <p>
          Puedes reagendar tu cita con al menos <strong>24 horas de antelación</strong> a
          la hora programada, directamente desde tu perfil o contactando al Negocio. Los
          reagendamientos con menos de 24 horas de anticipación quedan sujetos a la
          disponibilidad y criterio del Negocio.
        </p>
      </Section>

      <Section title="6. Cancelaciones e inasistencias">
        <p>
          Las cancelaciones realizadas con más de 24 horas de antelación no generan
          penalidad. La inasistencia repetida sin aviso puede resultar en restricciones
          para reservar nuevos horarios en el futuro.
        </p>
      </Section>

      <Section title="7. Pago del servicio">
        <p>
          El sitio solo gestiona la reserva del horario: no se realiza ningún pago en
          línea ni se solicitan datos de tarjetas o medios de pago a través del sitio.
          El valor del servicio se paga directamente en el local, el día de la cita.
        </p>
      </Section>

      <Section title="8. Responsabilidades del Negocio">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Prestar los servicios reservados con profesionalismo y calidad.</li>
          <li>Notificar al cliente ante cualquier cambio o cancelación.</li>
          <li>
            Proteger la información personal del cliente conforme a la Política de
            Privacidad.
          </li>
          <li>Mantener la plataforma disponible con el mejor esfuerzo posible.</li>
        </ul>
      </Section>

      <Section title="9. Responsabilidades del cliente">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Proporcionar información veraz y actualizada al crear tu cuenta y al reservar.</li>
          <li>Asistir puntualmente a las citas confirmadas.</li>
          <li>Notificar con anticipación suficiente en caso de no poder asistir.</li>
          <li>No compartir sus credenciales de acceso con terceros.</li>
        </ul>
      </Section>

      <Section title="10. Uso de fotografías">
        <p>
          El cliente puede subir fotografías de referencia o de resultados con fines
          exclusivos de gestión del servicio. La carga de fotografías requiere
          consentimiento explícito adicional conforme a nuestra Política de Privacidad.
          El Negocio no publicará fotografías del cliente sin su autorización expresa y
          por escrito.
        </p>
      </Section>

      <Section title="11. Propiedad intelectual">
        <p>
          El contenido, diseño y funcionalidad de la plataforma son propiedad del Negocio
          o de sus proveedores de tecnología. Queda prohibida su reproducción o
          distribución sin autorización.
        </p>
      </Section>

      <Section title="12. Modificaciones">
        <p>
          El Negocio puede modificar estos términos en cualquier momento. Los cambios
          serán notificados por correo electrónico y publicados en esta página con su
          fecha de vigencia. El uso continuado de la plataforma implica la aceptación de
          los nuevos términos.
        </p>
      </Section>

      <Section title="13. Legislación aplicable">
        <p>
          Estos términos se rigen por la legislación colombiana. Cualquier controversia
          será resuelta ante los jueces y tribunales competentes de Colombia.
        </p>
      </Section>

      <div className="mt-12 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        <Link href="/privacidad" className="hover:underline">
          Política de Privacidad
        </Link>
        {' · '}
        <Link href="/" className="hover:underline">
          Inicio
        </Link>
      </div>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  )
}