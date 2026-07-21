-- ============================================================
-- Migración 031: constraint real anti-solapamiento (overbooking)
-- QA (post fase 30) — hallazgo CRÍTICO #2.
--
-- Evidencia: el trigger check_cita_overlap() (migración 005) hace
-- un SELECT ... WHERE EXISTS (...) dentro de un BEFORE INSERT.
-- Bajo el nivel de aislamiento por defecto de Postgres (READ
-- COMMITTED), dos transacciones concurrentes que reservan el
-- mismo horario NO se ven una a la otra hasta que una de las dos
-- hace COMMIT. Escenario reproducible:
--   1. Transacción A: BEGIN; el trigger revisa citas existentes
--      (no ve nada en conflicto); INSERT fila A (aún sin commit).
--   2. Transacción B: BEGIN (antes de que A haga commit); el
--      trigger revisa citas existentes — tampoco ve la fila de A
--      porque no está comprometida; INSERT fila B.
--   3. A hace COMMIT. B hace COMMIT.
--   Resultado: dos citas que se solapan, ambas guardadas. El
--   trigger nunca se disparó con evidencia suficiente para
--   detectar el conflicto porque ninguna transacción tomó un
--   bloqueo real sobre el rango de horario en disputa.
--
-- Esto es exactamente lo que pide revisar la auditoría QA:
-- "Dos clientes reservando el mismo horario" / "Overbooking".
--
-- Fix: un EXCLUDE constraint de Postgres SÍ es seguro bajo
-- concurrencia (se implementa como un índice, igual que un UNIQUE
-- constraint: la segunda transacción que intenta comprometer un
-- rango en conflicto es bloqueada/rechazada por el motor, no por
-- lógica de aplicación). Se mantiene el trigger existente porque
-- da un mensaje de error más claro en el caso común (sin
-- concurrencia real); el EXCLUDE constraint es la red de
-- seguridad real para el caso concurrente.
-- ============================================================

-- Requiere btree_gist para poder combinar comparación de igualdad
-- (estado <> 'cancelada' vía WHERE parcial) con GiST sobre rangos.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Columna generada: rango de tiempo real de la cita (fecha + hora).
-- Se guarda como columna generada (STORED) para poder indexarla.
ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS rango_horario tsrange
  GENERATED ALWAYS AS (
    tsrange(
      (fecha + hora_inicio)::timestamp,
      (fecha + hora_fin)::timestamp,
      '[)'
    )
  ) STORED;

-- Elimina el constraint si ya existía (idempotente) y lo recrea.
ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_no_solapamiento;

ALTER TABLE citas
  ADD CONSTRAINT citas_no_solapamiento
  EXCLUDE USING gist (
    rango_horario WITH &&
  )
  WHERE (estado <> 'cancelada');

COMMENT ON CONSTRAINT citas_no_solapamiento ON citas IS
  'QA fase 30: red de seguridad real contra overbooking bajo concurrencia. El trigger check_cita_overlap() (migración 005) da el mensaje amigable en el caso no-concurrente; este EXCLUDE constraint es lo que garantiza atomicidad real cuando dos reservas llegan al mismo tiempo.';
