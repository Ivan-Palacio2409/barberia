-- ============================================================
-- 016_configuracion_negocio.sql — Fase 11
-- Configuración general del negocio.
-- Una única fila; se actualiza, nunca se inserta de nuevo.
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracion_negocio (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                VARCHAR(150)  NOT NULL DEFAULT 'Peluquería FORMA',
  logo_url              TEXT,
  direccion             TEXT,
  telefono              VARCHAR(20),
  redes_sociales        JSONB,
  politica_cancelacion  TEXT,
  metodos_pago          TEXT[],
  anticipo_requerido    DECIMAL(10,2),
  anticipo_tipo         VARCHAR(10)   DEFAULT 'fijo'
                          CHECK (anticipo_tipo IN ('fijo', 'porcentaje')),
  tiempo_descanso_min   INTEGER       NOT NULL DEFAULT 15,
  updated_at            TIMESTAMP     DEFAULT now()
);

-- Fila inicial
INSERT INTO configuracion_negocio (nombre, tiempo_descanso_min)
VALUES ('Peluquería FORMA', 15)
ON CONFLICT DO NOTHING;

-- Trigger updated_at
CREATE OR REPLACE TRIGGER trg_configuracion_negocio_updated_at
  BEFORE UPDATE ON configuracion_negocio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: SELECT público, escritura solo admin
ALTER TABLE configuracion_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_select_public" ON configuracion_negocio
  FOR SELECT USING (true);

CREATE POLICY "configuracion_admin_write" ON configuracion_negocio
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );
