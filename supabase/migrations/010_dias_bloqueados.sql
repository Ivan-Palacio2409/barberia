-- ============================================================
-- Migración 010: dias_bloqueados
-- Fechas concretas en las que el negocio no atiende (festivos,
-- vacaciones, eventos), independientemente del horario semanal
-- regular de horarios_trabajo.
-- ============================================================

CREATE TABLE dias_bloqueados (
  id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha  DATE         NOT NULL UNIQUE,
  motivo VARCHAR(255)
);

CREATE INDEX idx_dias_bloqueados_fecha ON dias_bloqueados(fecha);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE dias_bloqueados ENABLE ROW LEVEL SECURITY;

-- Lectura pública: el flujo de reserva necesita saber qué fechas
-- están bloqueadas para no ofrecerlas como opción.
CREATE POLICY "dias_bloqueados_select_publico" ON dias_bloqueados
  FOR SELECT USING (true);

-- Solo la administradora puede bloquear o desbloquear fechas.
CREATE POLICY "dias_bloqueados_admin_write" ON dias_bloqueados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE dias_bloqueados IS 'Fechas puntuales sin atención (festivos, vacaciones, eventos).';
