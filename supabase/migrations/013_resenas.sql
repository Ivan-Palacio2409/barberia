-- ============================================================
-- Migración 013: resenas
-- Reseñas públicas dejadas por clientes, con puntuación de 1 a 5.
-- ============================================================

CREATE TABLE resenas (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID      NOT NULL REFERENCES clientes(id),
  puntuacion  INTEGER   NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario  TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_resenas_cliente ON resenas(cliente_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

-- Lectura pública: las reseñas se muestran en el portal público
-- como prueba social.
CREATE POLICY "resenas_select_publico" ON resenas
  FOR SELECT USING (true);

-- Solo un cliente autenticado puede dejar su propia reseña.
CREATE POLICY "resenas_insert_propio" ON resenas
  FOR INSERT WITH CHECK (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- La administradora tiene acceso total (moderación).
CREATE POLICY "resenas_admin_all" ON resenas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE resenas IS 'Reseñas públicas de clientes, puntuación de 1 a 5.';
