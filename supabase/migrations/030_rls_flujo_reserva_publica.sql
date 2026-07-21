-- ============================================================
-- Migración 030: restaurar el flujo público de reserva
-- QA (post fase 30) — hallazgo CRÍTICO #1.
--
-- Evidencia: revisando las 29 migraciones + los 14 archivos
-- fase*_sql_editor.sql + las correcciones incluidas en este
-- proyecto, NINGUNA política RLS otorga permiso de INSERT a un
-- usuario no-administrador sobre `clientes`, `citas`,
-- `cita_servicios`, `estilos_referencia` ni `notificaciones`.
-- Todas las políticas de escritura existentes son "solo admin".
--
-- Como crearClienteInvitado(), crearCitaCompleta() y las
-- funciones de src/lib/citas/index.ts corren con la ANON KEY del
-- usuario final (no con service role), el flujo público de
-- reserva completo — crear cliente invitado, crear la cita,
-- asociar servicios, subir fotos y registrar la notificación de
-- confirmación — queda bloqueado por RLS de punta a punta tanto
-- para invitados como para clientes autenticados.
--
-- Nota: si tu proyecto de Supabase ya tiene políticas
-- equivalentes creadas manualmente desde el dashboard (no
-- reflejadas en este repo), este script es idempotente: usa
-- DROP POLICY IF EXISTS antes de cada CREATE POLICY.
-- ============================================================

-- ── clientes: permitir auto-registro de invitados y de titulares ──
DROP POLICY IF EXISTS "invitado_insert_propio_cliente" ON clientes;
CREATE POLICY "invitado_insert_propio_cliente" ON clientes
  FOR INSERT
  TO public
  WITH CHECK (auth_user_id IS NULL);

DROP POLICY IF EXISTS "cliente_insert_propio" ON clientes;
CREATE POLICY "cliente_insert_propio" ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- ── citas: permitir insertar la propia cita (invitado o titular) ──
DROP POLICY IF EXISTS "reserva_publica_insert_cita" ON citas;
CREATE POLICY "reserva_publica_insert_cita" ON citas
  FOR INSERT
  TO public
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE auth_user_id = auth.uid() OR auth_user_id IS NULL
    )
  );

-- ── cita_servicios: permitir asociar servicios a la propia cita ──
DROP POLICY IF EXISTS "reserva_publica_insert_cita_servicios" ON cita_servicios;
CREATE POLICY "reserva_publica_insert_cita_servicios" ON cita_servicios
  FOR INSERT
  TO public
  WITH CHECK (
    cita_id IN (
      SELECT c.id FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE cl.auth_user_id = auth.uid() OR cl.auth_user_id IS NULL
    )
  );

-- ── estilos_referencia: permitir subir fotos también a invitados ──
-- (la política "estilos_referencia_own" de la migración 007 ya
-- cubre a los clientes autenticados; esta la complementa para
-- invitados sin auth_user_id, sin tocar la política existente).
DROP POLICY IF EXISTS "reserva_publica_insert_estilos" ON estilos_referencia;
CREATE POLICY "reserva_publica_insert_estilos" ON estilos_referencia
  FOR INSERT
  TO public
  WITH CHECK (
    cita_id IN (
      SELECT c.id FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE cl.auth_user_id = auth.uid() OR cl.auth_user_id IS NULL
    )
  );

-- ── notificaciones: permitir registrar la notificación de confirmación ──
-- (la política "cliente_insert_notificaciones" de la migración 021
-- ya cubre a los clientes autenticados; esta la complementa para
-- invitados).
DROP POLICY IF EXISTS "reserva_publica_insert_notificaciones" ON notificaciones;
CREATE POLICY "reserva_publica_insert_notificaciones" ON notificaciones
  FOR INSERT
  TO public
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE auth_user_id = auth.uid() OR auth_user_id IS NULL
    )
  );

COMMENT ON POLICY "reserva_publica_insert_cita" ON citas IS
  'QA fase 30: sin esta política, crearCitaCompleta() falla por RLS para todo usuario no-admin.';
