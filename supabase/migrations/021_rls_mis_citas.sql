-- ============================================================
-- Migración 021 — RLS para sección "Mis citas" (Fase 13)
-- ============================================================
-- Asegura que los clientes solo puedan leer y modificar sus
-- propias citas. Si las políticas ya existen desde fases
-- anteriores, este script las reemplaza para garantizar
-- que estén exactamente como las necesita la Fase 13.
-- ============================================================

-- ── Habilitar RLS en tablas involucradas ────────────────────
ALTER TABLE citas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cita_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- ── Eliminar políticas previas que puedan entrar en conflicto ──
DROP POLICY IF EXISTS "cliente_select_propias_citas"   ON citas;
DROP POLICY IF EXISTS "cliente_update_propias_citas"   ON citas;
DROP POLICY IF EXISTS "cliente_select_cita_servicios"  ON cita_servicios;
DROP POLICY IF EXISTS "cliente_insert_notificaciones"  ON notificaciones;
DROP POLICY IF EXISTS "admin_all_citas"                ON citas;
DROP POLICY IF EXISTS "admin_all_cita_servicios"       ON cita_servicios;
DROP POLICY IF EXISTS "admin_all_notificaciones"       ON notificaciones;

-- ============================================================
-- TABLA: citas
-- ============================================================

-- Cliente solo ve sus propias citas
-- La relación es: auth.uid() -> clientes.auth_user_id -> clientes.id -> citas.cliente_id
CREATE POLICY "cliente_select_propias_citas"
  ON citas
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

-- Cliente puede actualizar solo sus citas activas (estado, fecha, hora)
CREATE POLICY "cliente_update_propias_citas"
  ON citas
  FOR UPDATE
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

-- Admin tiene acceso completo
CREATE POLICY "admin_all_citas"
  ON citas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );

-- ============================================================
-- TABLA: cita_servicios
-- ============================================================

-- Cliente puede leer los servicios de sus propias citas
CREATE POLICY "cliente_select_cita_servicios"
  ON cita_servicios
  FOR SELECT
  TO authenticated
  USING (
    cita_id IN (
      SELECT c.id FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE cl.auth_user_id = auth.uid()
    )
  );

-- Admin tiene acceso completo
CREATE POLICY "admin_all_cita_servicios"
  ON cita_servicios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );

-- ============================================================
-- TABLA: notificaciones
-- ============================================================

-- Cliente puede insertar notificaciones para sus propias citas
CREATE POLICY "cliente_insert_notificaciones"
  ON notificaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

-- Admin tiene acceso completo
CREATE POLICY "admin_all_notificaciones"
  ON notificaciones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );
