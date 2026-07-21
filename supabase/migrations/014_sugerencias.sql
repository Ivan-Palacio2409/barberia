-- ============================================================
-- Migración 014: sugerencias
-- Mensajes libres de clientes (quejas, ideas, sugerencias),
-- visibles únicamente para la administradora.
-- ============================================================

CREATE TABLE sugerencias (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID      NOT NULL REFERENCES clientes(id),
  mensaje     TEXT      NOT NULL,
  created_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_sugerencias_cliente ON sugerencias(cliente_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE sugerencias ENABLE ROW LEVEL SECURITY;

-- Solo un cliente autenticado puede enviar su propia sugerencia.
CREATE POLICY "sugerencias_insert_propio" ON sugerencias
  FOR INSERT WITH CHECK (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- El cliente puede ver únicamente las sugerencias que él mismo envió.
CREATE POLICY "sugerencias_select_propio" ON sugerencias
  FOR SELECT USING (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- La administradora tiene acceso total.
CREATE POLICY "sugerencias_admin_all" ON sugerencias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE sugerencias IS 'Sugerencias y mensajes libres de clientes. Solo visibles para el propio cliente y administración.';
