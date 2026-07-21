-- ============================================================
-- Migración 007: estilos_referencia
-- Imágenes de referencia que el cliente sube al reservar (ej.
-- el diseño de uñas que quiere replicar). El almacenamiento real
-- del archivo se configura en la Fase 6 (Supabase Storage); esta
-- tabla guarda únicamente la URL y a qué cita pertenece.
-- ============================================================

CREATE TABLE estilos_referencia (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id    UUID      NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  url_imagen TEXT      NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_estilos_referencia_cita ON estilos_referencia(cita_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE estilos_referencia ENABLE ROW LEVEL SECURITY;

-- El cliente ve y sube imágenes únicamente para sus propias citas.
CREATE POLICY "estilos_referencia_own" ON estilos_referencia
  FOR ALL USING (
    cita_id IN (
      SELECT c.id FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE cl.auth_user_id = auth.uid()
    )
  );

-- La administradora tiene acceso total.
CREATE POLICY "estilos_referencia_admin_all" ON estilos_referencia
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE estilos_referencia IS 'Imágenes de referencia adjuntadas por el cliente a una cita.';
