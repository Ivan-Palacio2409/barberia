-- ============================================================
-- Migración 009: horarios_trabajo
-- Horario de atención por día de la semana (0 = domingo, 6 =
-- sábado, siguiendo la convención estándar de Postgres/JS).
-- Seeds: lunes a viernes 08:00-18:00, sábado 08:00-16:00,
-- domingo sin fila (cerrado).
-- ============================================================

CREATE TABLE horarios_trabajo (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana  INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME    NOT NULL,
  hora_fin    TIME    NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT true,
  CHECK (hora_fin > hora_inicio)
);

INSERT INTO horarios_trabajo (dia_semana, hora_inicio, hora_fin) VALUES
  (1, '08:00', '18:00'),
  (2, '08:00', '18:00'),
  (3, '08:00', '18:00'),
  (4, '08:00', '18:00'),
  (5, '08:00', '18:00'),
  (6, '08:00', '16:00');

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE horarios_trabajo ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquier visitante necesita saber el horario
-- de atención para poder reservar.
CREATE POLICY "horarios_trabajo_select_publico" ON horarios_trabajo
  FOR SELECT USING (true);

-- Solo la administradora puede modificar el horario.
CREATE POLICY "horarios_trabajo_admin_write" ON horarios_trabajo
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE horarios_trabajo IS 'Horario de atención semanal. dia_semana: 0=domingo ... 6=sábado.';
