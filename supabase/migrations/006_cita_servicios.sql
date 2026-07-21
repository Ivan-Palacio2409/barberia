-- ============================================================
-- Migración 006: cita_servicios
-- Tabla puente: una cita puede incluir varios servicios (ej.
-- corte + tratamiento capilar en la misma reserva).
-- ============================================================

CREATE TABLE cita_servicios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id     UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES servicios(id)
);

CREATE INDEX idx_cita_servicios_cita     ON cita_servicios(cita_id);
CREATE INDEX idx_cita_servicios_servicio ON cita_servicios(servicio_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE cita_servicios ENABLE ROW LEVEL SECURITY;

-- El cliente ve los servicios de sus propias citas (vía join
-- contra citas, que ya filtra por cliente_id = auth.uid()).
CREATE POLICY "cita_servicios_own" ON cita_servicios
  FOR SELECT USING (
    cita_id IN (
      SELECT c.id FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE cl.auth_user_id = auth.uid()
    )
  );

-- La administradora tiene acceso total.
CREATE POLICY "cita_servicios_admin_all" ON cita_servicios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE cita_servicios IS 'Tabla puente: servicios incluidos en cada cita (relación muchos a muchos).';
