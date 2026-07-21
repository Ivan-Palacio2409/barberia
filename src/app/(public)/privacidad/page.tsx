import type { Metadata } from 'next'
import Link from 'next/link'

// ============================================================
// /privacidad — Fase 7 [C8]
// Política de privacidad pública — Ley 1581/2012 y
// Decreto 1377/2013 (Colombia).
// Accesible sin autenticación. Enlazada desde navbar y footer.
// ============================================================

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Conoce cómo recopilamos, usamos y protegemos tus datos personales conforme a la Ley 1581 de 2012.',
  robots: { index: true, follow: true },
}

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      <nav aria-label="Volver" className="mb-8">
        <Link href="/" className="text-sm text-primary hover:underline">
          Volver al inicio
        </Link>
      </nav>

      <h1 className="font-playfair mb-2 text-3xl font-semibold text-gray-800">
        Política de Privacidad
      </h1>
      <p className="mb-10 text-sm text-gray-400">
        Versión 1.0 — vigente desde la fecha de publicación
      </p>

      <Section title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de tus datos personales es la peluquería
          (en adelante <strong>el Negocio</strong>), con domicilio en Colombia. Para
          consultas sobre privacidad puedes escribirnos a través del formulario de
          contacto disponible en el sitio web.
        </p>
      </Section>

      <Section title="2. Datos que recopilamos">
        <p>Recopilamos los siguientes datos personales:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Nombre completo</li>
          <li>Número de teléfono</li>
          <li>Dirección de correo electrónico</li>
          <li>Fotografías de referencia de cortes o estilos (solo con consentimiento explícito)</li>
          <li>Información de citas: servicios, fechas, pagos</li>
          <li>Dirección IP (registrada en consentimientos para cumplimiento legal)</li>
        </ul>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Gestionar reservas y citas de servicios de peluquería</li>
          <li>Enviar notificaciones y recordatorios de citas</li>
          <li>Procesar pagos y anticipos</li>
          <li>Mejorar la experiencia del usuario en la plataforma</li>
          <li>Cumplir obligaciones legales y contables</li>
        </ul>
      </Section>

      <Section title="4. Base legal del tratamiento">
        <p>
          El tratamiento de tus datos se basa en el consentimiento explícito que otorgas
          al momento de registrarte o realizar una reserva, conforme a la Ley 1581 de 2012
          y el Decreto 1377 de 2013. Puedes revocar tu consentimiento en cualquier momento
          contactándonos directamente.
        </p>
      </Section>

      <Section title="5. Conservación de los datos">
        <p>
          Conservamos tus datos personales mientras mantengas una relación activa con el
          Negocio y durante el plazo exigido por la legislación colombiana vigente (mínimo
          5 años para registros contables). Las fotografías almacenadas se eliminan a
          solicitud del titular o al revocar el consentimiento correspondiente.
        </p>
      </Section>

      <Section title="6. Derechos de los titulares">
        <p>
          Conforme a la Ley 1581/2012, tienes derecho a:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Conocer, actualizar y rectificar tus datos personales</li>
          <li>Solicitar prueba del consentimiento otorgado</li>
          <li>Ser informado sobre el uso dado a tus datos</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)</li>
          <li>Revocar el consentimiento y solicitar la supresión de tus datos</li>
          <li>Acceder gratuitamente a tus datos personales</li>
        </ul>
        <p className="mt-3 text-sm">
          Para ejercer estos derechos contáctanos a través del formulario de contacto del
          sitio web. Atenderemos tu solicitud en un plazo máximo de 15 días hábiles.
        </p>
      </Section>

      <Section title="7. Transferencia y encargados del tratamiento">
        <p>
          Tus datos son procesados por los siguientes servicios de terceros, cada uno bajo
          sus propias políticas de privacidad:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>Supabase</strong> — almacenamiento de base de datos y archivos
            (supabase.com)
          </li>
          <li>
            <strong>Vercel</strong> — hospedaje de la aplicación web (vercel.com)
          </li>
          <li>
            <strong>Google Maps</strong> — visualización de la ubicación del negocio
            (mapa público embebido, sin recopilar datos personales)
          </li>
          <li>
            <strong>Google OAuth</strong> — inicio de sesión con cuenta de Google
            (opcional)
          </li>
        </ul>
        <p className="mt-3 text-sm">
          No vendemos ni cedemos tus datos personales a terceros con fines comerciales.
        </p>
      </Section>

      <Section title="8. Seguridad">
        <p>
          Implementamos medidas técnicas y organizativas para proteger tus datos contra
          acceso no autorizado, incluyendo cifrado en tránsito (HTTPS), acceso restringido
          por roles y políticas de seguridad a nivel de base de datos (Row Level Security).
        </p>
      </Section>

      <Section title="9. Fotografías">
        <p>
          Las fotografías de diseños que subas a la plataforma se almacenan de forma
          privada y solo son accesibles por ti y por el personal del Negocio. Su
          almacenamiento requiere consentimiento explícito adicional que puedes revocar
          en cualquier momento desde tu perfil.
        </p>
      </Section>

      <Section title="10. Cambios en esta política">
        <p>
          Cuando modifiquemos esta política te notificaremos por correo electrónico y
          publicaremos la nueva versión con su fecha de vigencia. El uso continuado de la
          plataforma implica la aceptación de los cambios.
        </p>
      </Section>

      <Section title="11. Contacto">
        <p>
          Para cualquier solicitud relacionada con tus datos personales o para ejercer
          tus derechos como titular, utiliza el formulario de contacto disponible en el
          sitio web o escríbenos directamente.
        </p>
      </Section>

      <div className="mt-12 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        <Link href="/terminos" className="hover:underline">
          Términos y Condiciones
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
