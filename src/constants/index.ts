// ============================================================
// CONSTANTES GLOBALES — Peluquería BARBERÍA
// ============================================================

export const APP_NAME = 'Peluquería BARBERÍA'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ── Rutas públicas ───────────────────────────────────────────
export const ROUTES = {
  home: '/',
  servicios: '/servicios',
  galeria: '/galeria',
  resenas: '/resenas',
  listaEspera: '/lista-espera',
  reservar: '/reservar',
  reservaConfirmada: (citaId: string) => `/reserva-confirmada/${citaId}`,
  privacidad: '/privacidad',
  terminos: '/terminos',
  // Auth
  login: '/login',
  registro: '/registro',
  // Cliente
  clienteCitas: '/cliente/mis-citas',
  clientePerfil: '/cliente/perfil',
  // Admin
  adminDashboard: '/admin',
  adminCitas: '/admin/citas',
  adminClientes: '/admin/clientes',
  adminServicios: '/admin/servicios',
  adminHorarios: '/admin/horarios',
  adminReportes: '/admin/reportes',
  adminConfiguracion: '/admin/configuracion',
} as const

// ── Canales de notificación ──────────────────────────────────
export const CANALES_NOTIFICACION = ['email', 'whatsapp', 'push'] as const

// ── Versiones de documentos legales (Ley 1581/2012) ─────────
export const VERSIONES_LEGALES = {
  politicaPrivacidad: '1.0.0',
  terminosCondiciones: '1.0.0',
} as const

// ── Buckets de Supabase Storage (Fase 6) ────────────────────
export const STORAGE_BUCKETS = {
  fotosClientes: 'fotos-clientes',
  estilosReferencia: 'estilos-referencia',
  galeria: 'galeria',
  negocio: 'negocio',
} as const

// ── Límites ──────────────────────────────────────────────────
export const LIMITS = {
  maxFotosCliente: 10,
  maxEstilosFavoritos: 50,
  maxDescripcionServicio: 500,
  paginationDefault: 20,
} as const

// ── Legal [C8] — re-exportado desde constants/legal.ts ───────
export * from './legal'