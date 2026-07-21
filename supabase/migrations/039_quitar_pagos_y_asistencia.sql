-- ============================================================
-- 039_quitar_pagos_y_asistencia.sql
--
-- Ejecutar este script UNA VEZ en el SQL Editor de Supabase.
-- Resume los cambios de esta fase:
--
--   1. Elimina por completo la tabla `pagos` y las columnas de
--      pagos/anticipos en `configuracion_negocio` — el sitio ya
--      no procesa ni registra pagos, solo la reserva del horario.
--   2. Agrega a `citas` el seguimiento de asistencia post-cita
--      (asistio, quién la confirmó, cuándo) y el estado nuevo
--      'no_asistio'.
--   3. Agrega a `notificaciones` la columna `destinatario`
--      ('cliente' | 'admin') y los nuevos tipos de notificación:
--      nueva_reserva_admin, recordatorio_1_hora, resumen_diario_admin
--      (y quita 'confirmacion_pago', que ya no aplica).
--
-- Es seguro correrlo sobre una base de datos con datos reales:
-- no borra filas de `citas` ni `clientes`, solo la tabla `pagos`
-- (que ya no se usa) y columnas de configuración de pagos.
-- ============================================================

-- ── 1. Eliminar pagos ──────────────────────────────────────────
DROP TABLE IF EXISTS pagos CASCADE;

ALTER TABLE configuracion_negocio
  DROP COLUMN IF EXISTS metodos_pago,
  DROP COLUMN IF EXISTS anticipo_requerido,
  DROP COLUMN IF EXISTS anticipo_tipo;

-- ── 2. Asistencia post-cita en `citas` ─────────────────────────
ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS asistio BOOLEAN,
  ADD COLUMN IF NOT EXISTS asistencia_confirmada_por VARCHAR(10)
    CHECK (asistencia_confirmada_por IN ('cliente', 'admin')),
  ADD COLUMN IF NOT EXISTS asistencia_confirmada_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resena_solicitada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resena_solicitada_at TIMESTAMP;

-- Nuevo estado 'no_asistio' en el CHECK de citas.estado
ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_estado_check;
ALTER TABLE citas ADD CONSTRAINT citas_estado_check
  CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'));

-- El trigger anti-solapamiento (005_citas.sql) ya excluye solo
-- 'cancelada'; una cita 'no_asistio' es siempre en el pasado así
-- que no afecta disponibilidad futura, no hace falta tocarlo.

-- ── 3. `notificaciones`: destinatario + nuevos tipos ───────────
ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS destinatario VARCHAR(10) NOT NULL DEFAULT 'cliente'
    CHECK (destinatario IN ('cliente', 'admin'));

ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo IN (
    'confirmacion_cita', 'nueva_reserva_admin',
    'recordatorio_24_horas', 'recordatorio_mismo_dia', 'recordatorio_1_hora',
    'resumen_diario_admin', 'reagendamiento_cita', 'cancelacion_cita',
    'solicitud_resena', 'aviso_lista_espera'
  ));

CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones(destinatario);

COMMENT ON COLUMN citas.asistio IS 'NULL = aun no se confirma asistencia. true = asistio (dispara solicitud_resena). false = no_asistio.';
COMMENT ON COLUMN notificaciones.destinatario IS 'A quien se le envia: al propio cliente de la cita, o al admin del negocio (usa ADMIN_EMAIL/ADMIN_WHATSAPP_PHONE).';
