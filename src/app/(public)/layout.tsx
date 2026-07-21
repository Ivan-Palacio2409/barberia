import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'

// Este layout envuelve todas las rutas del grupo (public):
// /, /servicios, /galeria, /privacidad, /terminos, /reservar, etc.
//
// Tema oscuro del sitio público ("barbería nocturna"): el fondo
// base y el color de texto por defecto se definen acá, usando
// los tokens --pub-* declarados en globals.css. Estos tokens NO
// se usan en /admin ni en /cliente, así que este cambio queda
// aislado al sitio de marketing.

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pub-grain min-h-screen"
      style={{ background: 'var(--pub-bg)', color: 'var(--pub-text)' }}
    >
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}