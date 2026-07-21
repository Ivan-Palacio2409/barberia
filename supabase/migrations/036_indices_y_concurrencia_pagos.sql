-- ============================================================
-- Migración 036: auditoría enterprise — base de datos y concurrencia.
-- ============================================================

-- ── Revisión 2/8 (rendimiento/BD): índice compuesto para el
-- patrón de consulta más común del calendario admin y reportes
-- (citas de un rango de fechas, excluyendo canceladas). Los
-- índices individuales en fecha y estado (migración 005) ya
-- ayudan, pero un índice compuesto evita el bitmap-and extra en
-- el plan de consulta cuando el volumen de citas crezca.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado ON citas(fecha, estado);

-- ============================================================
-- Revisión 3 (concurrencia): "dos pagos simultáneos" — evidencia:
-- no existía ningún constraint que impidiera insertar DOS filas
-- 'pagado' del mismo tipo_pago para la misma cita_id. Un admin
-- haciendo doble clic en "registrar pago" (o dos pestañas
-- abiertas) podía duplicar el registro de un pago ya hecho,
-- inflando el reporte de ingresos.
--
-- Se usa un índice único PARCIAL (solo sobre estado = 'pagado')
-- en vez de un UNIQUE constraint simple, para no romper el flujo
-- normal de crear una fila en 'pendiente' y después otra en
-- 'pagado' (o reintentar tras un pago rechazado): eso sigue
-- funcionando igual. Lo que se bloquea es tener DOS pagos ya
-- confirmados del mismo tipo para la misma cita, que es siempre
-- un error/duplicado, nunca un caso de uso legítimo dado que
-- tipo_pago solo admite 'anticipo' y 'pago_final'.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_unico_pagado
  ON pagos(cita_id, tipo_pago)
  WHERE estado = 'pagado';

COMMENT ON INDEX idx_pagos_unico_pagado IS
  'Auditoría enterprise: evita registrar dos veces el mismo pago (anticipo/pago_final) para una cita bajo concurrencia (doble clic, dos pestañas). Si el INSERT falla por esto, la UI debe mostrar "este pago ya fue registrado" en vez de un error genérico.';
