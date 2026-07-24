// ============================================================
// TIPOS — Fase 3: profiles, clientes, catálogo, consentimientos
// ============================================================

export type Rol = 'administrador' | 'cliente'

export interface Profile {
  id: string
  nombre: string
  telefono?: string
  rol: Rol
  foto_perfil?: string
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  auth_user_id?: string | null
  nombre: string
  telefono: string
  email?: string
  fecha_ultima_visita?: string
  observaciones?: string
  created_at: string
  updated_at: string
}

export interface CategoriaServicio {
  id: string
  nombre: string
}

export interface Servicio {
  id: string
  categoria_id: string
  nombre: string
  descripcion?: string
  precio: number
  duracion_minutos: number
  activo: boolean
  imagen_url?: string
  created_at: string
  categoria?: CategoriaServicio
}

export type TipoConsentimiento = 'tratamiento_datos' | 'almacenamiento_fotografias'

export interface Consentimiento {
  id: string
  cliente_id: string
  tipo_consentimiento: TipoConsentimiento
  version_documento: string
  aceptado: boolean
  ip?: string
  created_at: string
  updated_at: string
}

// ============================================================
// TIPOS — Fase 4: citas, servicios de la cita, pagos y diseños
// ============================================================

export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio'

export interface Cita {
  id: string
  cliente_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoCita
  precio_total?: number
  notas?: string
  created_at: string
  cliente?: Cliente
  servicios?: Servicio[]
  estilos_referencia?: EstiloReferencia[]
  // ── Asistencia y reseña (post-cita) ──────────────────────
  asistio?: boolean | null
  asistencia_confirmada_por?: 'cliente' | 'admin' | null
  asistencia_confirmada_at?: string | null
  resena_solicitada?: boolean
  resena_solicitada_at?: string | null
}

// ── Cita con cita_servicios expandidos (Fase 13) ─────────────
export interface CitaConServicios extends Cita {
  cita_servicios?: {
    id: string
    servicio: Servicio
  }[]
}

export interface CitaServicio {
  id: string
  cita_id: string
  servicio_id: string
  servicio?: Servicio
}

export interface EstiloReferencia {
  id: string
  cita_id: string
  url_imagen: string
  created_at: string
}

// ============================================================
// TIPOS — Fase 5
// ============================================================

export type BloqueHorario = 'manana' | 'tarde'

export interface HorarioTrabajo {
  id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  activo: boolean
  bloque: BloqueHorario
}

export interface DiaBloqueado {
  id: string
  fecha: string
  motivo?: string
}

export type EstadoListaEspera = 'en_espera' | 'notificado' | 'convertido' | 'cancelado'

export interface ListaEspera {
  id: string
  cliente_id: string
  fecha_solicitada: string
  servicios_deseados?: string
  estado: EstadoListaEspera
  created_at: string
  cliente?: Cliente
}

export type TipoNotificacion =
  | 'confirmacion_cita'
  | 'nueva_reserva_admin'
  | 'nueva_resena_admin'
  | 'recordatorio_24_horas'
  | 'recordatorio_mismo_dia'
  | 'recordatorio_1_hora'
  | 'resumen_diario_admin'
  | 'reagendamiento_cita'
  | 'cancelacion_cita'
  | 'solicitud_resena'
  | 'aviso_lista_espera'
  | 'solicitud_eliminacion_cuenta'

export type CanalNotificacion = 'email' | 'whatsapp' | 'ambos'
export type DestinatarioNotificacion = 'cliente' | 'admin'

export interface Notificacion {
  id: string
  cliente_id: string
  cita_id?: string
  tipo: TipoNotificacion
  canal: CanalNotificacion
  destinatario: DestinatarioNotificacion
  enviado: boolean
  // Migracion 042: persistido en la base de datos (antes solo vivia
  // en memoria del navegador y se perdia al recargar/cerrar sesion).
  leida: boolean
  fecha_programada: string
}

// Fase 27: nombres de servicios de la cita asociada a una resena,
// usados para mostrar "servicio reseñado" en admin y portal publico.
export interface ResenaCitaInfo {
  id: string
  fecha: string
  servicios_nombres: string[]
}

export interface Resena {
  id: string
  cliente_id: string
  cita_id?: string | null   // Fase 26: vinculo opcional con la cita
  puntuacion: number
  comentario?: string
  created_at: string
  cliente?: Cliente
  cita?: ResenaCitaInfo      // Fase 27: info derivada de la cita (join)
}

export interface Sugerencia {
  id: string
  cliente_id: string
  mensaje: string
  created_at: string
}

export interface CatalogoEstilo {
  id: string
  titulo: string
  categoria_id?: string | null
  imagen_url: string
  precio_referencia?: number
  destacado: boolean
  categoria?: CategoriaServicio
}

// ============================================================
// TIPOS — Fase 14: diseños favoritos
// ============================================================

export interface EstiloFavorito {
  id: string
  cliente_id: string
  catalogo_estilo_id: string
  created_at: string
  catalogo_estilo?: CatalogoEstilo
}

// ============================================================
// TIPOS — Fase 17: Dashboard administrativo
// ============================================================

export interface DashboardStats {
  citas_hoy_count: number
  citas_semana_count: number
  citas_mes_count: number
  tasa_asistencia_mes: number // 0-100
  citas_hoy: CitaDashboard[]
  proxima_cita: CitaDashboard | null
  top_servicios: TopServicio[]
  clientes_nuevos_mes: number
  cancelaciones_semana: number
  no_asistio_semana: number
}

export interface CitaDashboard {
  id: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoCita
  cliente_nombre: string
  servicios_nombres: string[]
  precio_total: number
}

export interface TopServicio {
  nombre: string
  cantidad: number
}

// ============================================================
// TIPOS — Fase 18: Calendario administrativo
// ============================================================

export interface CitaCalendario {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoCita
  precio_total: number
  notas?: string
  cliente: {
    id: string
    nombre: string
    telefono: string
  }
  servicios: {
    id: string
    nombre: string
    duracion_minutos: number
    precio: number
  }[]
}

export interface NuevaCitaManualInput {
  cliente_id: string
  fecha: string
  hora_inicio: string
  servicio_ids: string[]
  notas?: string
}

// ============================================================
// TIPOS — Fase 21: horarios especiales y configuración negocio
// ============================================================

export interface HorarioEspecial {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  motivo?: string
  created_at: string
}

export interface RedesSociales {
  instagram?: string
  facebook?: string
  tiktok?: string
  whatsapp?: string
}

export interface ConfiguracionNegocio {
  id: string
  nombre: string
  logo_url?: string
  direccion?: string
  telefono?: string
  redes_sociales?: RedesSociales
  politica_cancelacion?: string
  tiempo_descanso_min: number
  updated_at: string
}