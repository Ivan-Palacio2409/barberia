-- ============================================================
-- Migración 005: citas
-- Cita reservada por un cliente. Incluye el trigger anti-
-- solapamiento: no permite dos citas activas que se cruzan en
-- el mismo horario, y el trigger que actualiza la fecha de
-- última visita del cliente cuando una cita se marca completada.
-- ============================================================

CREATE TABLE citas (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID          NOT NULL REFERENCES clientes(id),
  fecha        DATE          NOT NULL,
  hora_inicio  TIME          NOT NULL,
  hora_fin     TIME          NOT NULL,
  estado       VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                             CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  precio_total DECIMAL(10,2),
  notas        TEXT,
  created_at   TIMESTAMP     DEFAULT now(),
  CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_citas_cliente ON citas(cliente_id);
CREATE INDEX idx_citas_fecha   ON citas(fecha);
CREATE INDEX idx_citas_estado  ON citas(estado);

-- ── Trigger anti-solapamiento ─────────────────────────────────
-- Antes de insertar o actualizar una cita, verifica que no exista
-- otra cita activa (no cancelada) el mismo día cuyo rango horario
-- se cruce con el nuevo. Usa el operador OVERLAPS de Postgres,
-- que compara dos rangos (hora_inicio, hora_fin) directamente.
CREATE OR REPLACE FUNCTION check_cita_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM citas
    WHERE fecha = NEW.fecha
      AND estado NOT IN ('cancelada')
      AND id <> COALESCE(NEW.id, gen_random_uuid())
      AND (hora_inicio, hora_fin) OVERLAPS (NEW.hora_inicio, NEW.hora_fin)
  ) THEN
    RAISE EXCEPTION 'Ya existe una cita en ese horario';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_overlap
  BEFORE INSERT OR UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION check_cita_overlap();

-- ── Trigger: actualizar fecha_ultima_visita del cliente ──────
-- Se dispara solo en la transición hacia 'completada' (no en
-- cada UPDATE), para no sobreescribir la fecha si la cita se
-- edita por otro motivo después de completada.
CREATE OR REPLACE FUNCTION update_fecha_ultima_visita()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completada' AND OLD.estado <> 'completada' THEN
    UPDATE clientes
    SET fecha_ultima_visita = NEW.fecha, updated_at = now()
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ultima_visita
  AFTER UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION update_fecha_ultima_visita();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- El cliente ve únicamente las citas asociadas a su registro.
CREATE POLICY "citas_own" ON citas
  FOR SELECT USING (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- La administradora tiene acceso total (gestión completa de la agenda).
CREATE POLICY "citas_admin_all" ON citas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE citas IS 'Citas reservadas por clientes. Trigger anti-solapamiento e historial de última visita.';
