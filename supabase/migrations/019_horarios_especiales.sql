-- ============================================================
-- Migración 019: horarios_especiales
-- Permite definir un horario diferente al regular para una
-- fecha puntual (ej. "el 24 de diciembre atendemos solo de
-- 08:00 a 13:00"). Tiene precedencia sobre horarios_trabajo
-- en el cálculo de disponibilidad.
-- ============================================================

CREATE TABLE IF NOT EXISTS horarios_especiales (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha       DATE    NOT NULL UNIQUE,
  hora_inicio TIME    NOT NULL,
  hora_fin    TIME    NOT NULL,
  motivo      VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horarios_especiales_fecha
  ON horarios_especiales(fecha);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE horarios_especiales ENABLE ROW LEVEL SECURITY;

-- Lectura pública: el flujo de reserva necesita conocer si una
-- fecha tiene un horario especial para calcular slots.
CREATE POLICY "horarios_especiales_select_publico"
  ON horarios_especiales
  FOR SELECT
  USING (true);

-- Solo la administradora puede crear/editar/eliminar.
CREATE POLICY "horarios_especiales_admin_write"
  ON horarios_especiales
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE horarios_especiales IS
  'Horario de atención puntual para una fecha concreta. '
  'Tiene precedencia sobre horarios_trabajo al calcular disponibilidad.';
