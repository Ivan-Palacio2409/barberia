'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LEGAL_VERSIONS } from '@/constants/legal'
import { getSlotsDisponibles } from '@/services/disponibilidad'
import { BUCKETS, ALLOWED_TYPES, MAX_FILE_SIZE } from '@/lib/supabase/storage'
import { logger } from '@/lib/logger'
import { checkRateLimitDistributed } from '@/lib/rate-limit'

// ============================================================
// Server Action — crearCitaCompleta
// Fase 12: Crea la cita de forma transaccional:
//   1. Re-valida que el slot sigue disponible (409 si ocupado)
//   2. INSERT en citas
//   3. INSERT en cita_servicios
//   4. Upload de imágenes + INSERT en estilos_referencia
//   5. INSERT en notificaciones (confirmacion_cita, canal: email)
//   6. [C8] INSERT consentimiento tratamiento_datos si no existe
//   7. [C8] INSERT consentimiento almacenamiento_fotografias si subió fotos
// ============================================================

export interface ImagenInput {
  nombre: string       // nombre original del archivo
  tipo: string         // MIME type
  base64: string       // datos del archivo en base64 (sin prefijo data:...)
  tamano: number       // bytes
}

export interface CrearCitaInput {
  clienteId: string
  authUserId: string | null
  fecha: string
  horaInicio: string
  horaFin: string
  serviciosIds: string[]
  precioTotal: number
  notas?: string
  imagenes?: ImagenInput[]
  consentimientoFotos: boolean
}

export interface CrearCitaResult {
  ok: boolean
  citaId?: string
  error?: string
  code?: 'SLOT_OCUPADO' | 'ERROR_GENERICO'
}

export async function crearCitaCompleta(
  input: CrearCitaInput,
): Promise<CrearCitaResult> {
  // ── -1. Rate limiting ──────────────────────────────────────
  // Auditoría enterprise (Revisión 9 — seguridad): esta acción es
  // pública, sin autenticación, y escribe en la base de datos y
  // sube archivos a Storage. Sin límite, un script podía llamarla
  // en loop (spam de citas, agotar cuota de Storage, forzar
  // reintentos contra el EXCLUDE constraint de la migración 031).
  // Límite: 8 intentos cada 10 minutos por IP — generoso para un
  // uso legítimo (una persona reservando, con algún reintento si
  // el horario se ocupó), pero corta un loop automatizado.
  //
  // Distribuido (migración 037): esta acción puede correr en
  // cualquier instancia/función serverless, así que el conteo se
  // confirma contra Postgres (compartido entre todas), no solo en
  // memoria del proceso actual.
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'desconocida'

  const supabase = await createClient()

  const { allowed } = await checkRateLimitDistributed(supabase, `crear-cita:${ip}`, {
    windowMs: 10 * 60_000,
    max: 8,
  })
  if (!allowed) {
    return {
      ok: false,
      code: 'ERROR_GENERICO',
      error: 'Demasiados intentos de reserva. Esperá unos minutos e intentá de nuevo.',
    }
  }

  // ── 0. Rechazar fechas pasadas con un mensaje claro ────────
  // QA fase 30: antes, una fecha pasada terminaba devolviendo el
  // mismo mensaje genérico de "horario ocupado" (porque
  // getSlotsDisponibles ahora las excluye), lo cual confunde al
  // usuario. Este chequeo explícito da el mensaje correcto.
  const hoyISO = new Date().toISOString().split('T')[0]
  if (input.fecha < hoyISO) {
    return {
      ok: false,
      code: 'ERROR_GENERICO',
      error: 'No se pueden agendar citas en fechas pasadas.',
    }
  }

  // ── 1. Re-validar disponibilidad del slot ─────────────────
  const duracion = calcularDuracion(input.horaInicio, input.horaFin)
  const slotsDisponibles = await getSlotsDisponibles(input.fecha, duracion)
  const slotValido = slotsDisponibles.some(
    (s) => s.horaInicio === input.horaInicio,
  )

  if (!slotValido) {
    return {
      ok: false,
      code: 'SLOT_OCUPADO',
      error:
        'El horario seleccionado ya no está disponible. Por favor elige otro.',
    }
  }

  // ── 2. INSERT cita ────────────────────────────────────────
  const { data: cita, error: errorCita } = await supabase
    .from('citas')
    .insert({
      cliente_id: input.clienteId,
      fecha: input.fecha,
      hora_inicio: input.horaInicio,
      hora_fin: input.horaFin,
      precio_total: input.precioTotal,
      notas: input.notas || null,
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (errorCita || !cita) {
    logger.error('[crearCitaCompleta] Error INSERT cita:', errorCita?.message)

    // QA fase 30: si dos personas reservan el mismo horario al
    // mismo tiempo, el paso 1 (re-validación) puede pasar para
    // ambas (condición de carrera) y quien pierde la carrera real
    // es rechazada recién aquí, por el EXCLUDE constraint
    // "citas_no_solapamiento" (migración 031) o por el trigger
    // check_cita_overlap (migración 005). Se detecta por código
    // de error (23P01 = exclusion_violation) o por el mensaje del
    // trigger, y se traduce al mismo código SLOT_OCUPADO que ya
    // maneja la UI, en vez de un error genérico.
    const esConflictoHorario =
      errorCita?.code === '23P01' ||
      errorCita?.message?.toLowerCase().includes('ya existe una cita')

    if (esConflictoHorario) {
      return {
        ok: false,
        code: 'SLOT_OCUPADO',
        error:
          'Justo se reservó ese horario. Por favor elige otro.',
      }
    }

    return { ok: false, code: 'ERROR_GENERICO', error: 'Error al crear la cita.' }
  }

  const citaId = cita.id

  // ── 3. INSERT cita_servicios ──────────────────────────────
  const filasServicios = input.serviciosIds.map((servicio_id) => ({
    cita_id: citaId,
    servicio_id,
  }))

  const { error: errorServicios } = await supabase
    .from('cita_servicios')
    .insert(filasServicios)

  if (errorServicios) {
    logger.error('[crearCitaCompleta] Error INSERT cita_servicios:', errorServicios.message)
    // Revertir cita
    await supabase.from('citas').delete().eq('id', citaId)
    return { ok: false, code: 'ERROR_GENERICO', error: 'Error al asociar los servicios.' }
  }

  // ── 4. Upload imágenes + INSERT estilos_referencia ────────
  if (
    input.consentimientoFotos &&
    input.imagenes &&
    input.imagenes.length > 0
  ) {
    const pathBase = input.authUserId ?? input.clienteId

    for (const imagen of input.imagenes) {
      try {
        // QA fase 30: antes se confiaba en la validación del
        // navegador (validateFile en ImageUpload.tsx). Un Server
        // Action recibe el body igual sin importar si vino de la
        // UI o de una petición armada a mano, así que hay que
        // validar tipo y tamaño también acá, con las mismas
        // constantes que usa el cliente (ALLOWED_TYPES/MAX_FILE_SIZE
        // de lib/supabase/storage.ts) para no duplicar la regla.
        if (!ALLOWED_TYPES.includes(imagen.tipo as (typeof ALLOWED_TYPES)[number])) {
          logger.error('[crearCitaCompleta] Imagen rechazada, tipo no permitido:', imagen.tipo)
          continue
        }
        if (imagen.tamano > MAX_FILE_SIZE) {
          logger.error('[crearCitaCompleta] Imagen rechazada, supera el tamaño máximo:', imagen.tamano)
          continue
        }

        // Reconstruir File desde base64
        const binaryStr = atob(imagen.base64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: imagen.tipo })
        const file = new File([blob], imagen.nombre, { type: imagen.tipo })

        const ext = imagen.nombre.split('.').pop() ?? 'jpg'
        const stamp = Date.now()
        const rand = Math.random().toString(36).slice(2, 8)
        const path = `${pathBase}/${stamp}-${rand}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKETS.ESTILOS_REFERENCIA)
          .upload(path, file, { upsert: false })

        if (uploadError) {
          logger.error('[crearCitaCompleta] Error upload imagen:', uploadError.message)
          continue
        }

        await supabase.from('estilos_referencia').insert({
          cita_id: citaId,
          url_imagen: path,
        })
      } catch (e) {
        logger.error('[crearCitaCompleta] Error procesando imagen:', e)
      }
    }
  }

  // ── 5. INSERT notificacion confirmacion_cita ──────────────
  // H5: canal 'ambos' (email + WhatsApp) — el dispatcher intenta
  // WhatsApp primero y cae a email si falla o si aún no hay
  // credenciales de WhatsApp configuradas.
  const { error: errorNotifConfirmacion } = await supabase.from('notificaciones').insert({
    cliente_id: input.clienteId,
    cita_id: citaId,
    tipo: 'confirmacion_cita',
    canal: 'ambos',
    destinatario: 'cliente',
    fecha_programada: new Date().toISOString(),
    enviado: false,
  })
  // QA fase 30 (M3): antes se ignoraba en silencio. No bloquea la
  // creación de la cita (ya existe), pero queda logueado.
  if (errorNotifConfirmacion) {
    logger.error('[crearCitaCompleta] No se pudo registrar la notificación de confirmación:', citaId, errorNotifConfirmacion.message)
  }

  // ── 5a. INSERT notificacion nueva_reserva_admin ────────────
  // Aviso inmediato al admin de que se hizo una reserva nueva.
  const { error: errorNotifAdmin } = await supabase.from('notificaciones').insert({
    cliente_id: input.clienteId,
    cita_id: citaId,
    tipo: 'nueva_reserva_admin',
    canal: 'ambos',
    destinatario: 'admin',
    fecha_programada: new Date().toISOString(),
    enviado: false,
  })
  if (errorNotifAdmin) {
    logger.error('[crearCitaCompleta] No se pudo registrar el aviso al admin:', citaId, errorNotifAdmin.message)
  }

  // ── 5b. Programar recordatorios (H5) ──────────────────────
  // El aviso de confirmación se envía de inmediato (fecha_programada = ahora);
  // los recordatorios se programan para el futuro y los recoge
  // /api/notificaciones/procesar cuando llegue su fecha_programada.
  const inicioCitaMs = new Date(`${input.fecha}T${input.horaInicio}:00`).getTime()
  const filasRecordatorios: Array<{
    cliente_id: string
    cita_id: string
    tipo: 'recordatorio_24_horas' | 'recordatorio_mismo_dia' | 'recordatorio_1_hora'
    canal: 'ambos'
    destinatario: 'cliente' | 'admin'
    fecha_programada: string
    enviado: boolean
  }> = []

  const momento24h = inicioCitaMs - 24 * 60 * 60 * 1000
  if (momento24h > Date.now()) {
    filasRecordatorios.push({
      cliente_id: input.clienteId,
      cita_id: citaId,
      tipo: 'recordatorio_24_horas',
      canal: 'ambos',
      destinatario: 'cliente',
      fecha_programada: new Date(momento24h).toISOString(),
      enviado: false,
    })
  }

  // Recordatorio del mismo día: 8:00 a.m. del día de la cita (o
  // "ahora" si la cita es hoy antes de las 8 a.m., para no perderlo).
  const fechaCita = new Date(`${input.fecha}T08:00:00`)
  const momentoMismoDia = fechaCita.getTime() < Date.now() ? Date.now() : fechaCita.getTime()
  if (momentoMismoDia < inicioCitaMs) {
    filasRecordatorios.push({
      cliente_id: input.clienteId,
      cita_id: citaId,
      tipo: 'recordatorio_mismo_dia',
      canal: 'ambos',
      destinatario: 'cliente',
      fecha_programada: new Date(momentoMismoDia).toISOString(),
      enviado: false,
    })
  }

  // Recordatorio 1 hora antes — para el CLIENTE y para el ADMIN.
  const momento1h = inicioCitaMs - 60 * 60 * 1000
  if (momento1h > Date.now()) {
    filasRecordatorios.push({
      cliente_id: input.clienteId,
      cita_id: citaId,
      tipo: 'recordatorio_1_hora',
      canal: 'ambos',
      destinatario: 'cliente',
      fecha_programada: new Date(momento1h).toISOString(),
      enviado: false,
    })
    filasRecordatorios.push({
      cliente_id: input.clienteId,
      cita_id: citaId,
      tipo: 'recordatorio_1_hora',
      canal: 'ambos',
      destinatario: 'admin',
      fecha_programada: new Date(momento1h).toISOString(),
      enviado: false,
    })
  }

  if (filasRecordatorios.length > 0) {
    const { error: errorRecordatorios } = await supabase.from('notificaciones').insert(filasRecordatorios)
    if (errorRecordatorios) {
      logger.error('[crearCitaCompleta] No se pudieron programar los recordatorios:', citaId, errorRecordatorios.message)
    }
  }

  // ── 6 & 7. [C8] Registrar consentimientos ────────────────
  // ip/headersList ya se calcularon arriba para el rate limiting.

  // Consentimiento tratamiento_datos (siempre — fue aceptado en paso 4)
  const { data: existeTratamiento } = await supabase
    .from('consentimientos')
    .select('id')
    .eq('cliente_id', input.clienteId)
    .eq('tipo_consentimiento', 'tratamiento_datos')
    .eq('version_documento', LEGAL_VERSIONS.PRIVACIDAD)
    .eq('aceptado', true)
    .maybeSingle()

  if (!existeTratamiento) {
    await supabase.from('consentimientos').insert({
      cliente_id: input.clienteId,
      tipo_consentimiento: 'tratamiento_datos',
      version_documento: LEGAL_VERSIONS.PRIVACIDAD,
      aceptado: true,
      ip,
    })
  }

  // Consentimiento almacenamiento_fotografias (solo si subió fotos)
  if (input.consentimientoFotos && input.imagenes && input.imagenes.length > 0) {
    const { data: existeFotos } = await supabase
      .from('consentimientos')
      .select('id')
      .eq('cliente_id', input.clienteId)
      .eq('tipo_consentimiento', 'almacenamiento_fotografias')
      .eq('version_documento', LEGAL_VERSIONS.FOTOGRAFIAS)
      .eq('aceptado', true)
      .maybeSingle()

    if (!existeFotos) {
      await supabase.from('consentimientos').insert({
        cliente_id: input.clienteId,
        tipo_consentimiento: 'almacenamiento_fotografias',
        version_documento: LEGAL_VERSIONS.FOTOGRAFIAS,
        aceptado: true,
        ip,
      })
    }
  }

  return { ok: true, citaId }
}

// ── Helper ────────────────────────────────────────────────────
function calcularDuracion(horaInicio: string, horaFin: string): number {
  const [hI, mI] = horaInicio.split(':').map(Number)
  const [hF, mF] = horaFin.split(':').map(Number)
  return hF * 60 + mF - (hI * 60 + mI)
}
