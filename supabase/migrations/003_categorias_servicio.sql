-- ============================================================
-- Migración 003: categorias_servicio
-- Categorías fijas del catálogo: Uñas, Cejas, Pestañas.
-- ============================================================

CREATE TABLE categorias_servicio (
  id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50)  NOT NULL UNIQUE
);

INSERT INTO categorias_servicio (nombre) VALUES
  ('Uñas'),
  ('Cejas'),
  ('Pestañas');

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE categorias_servicio ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquier visitante ve el catálogo.
CREATE POLICY "categorias_select_publico" ON categorias_servicio
  FOR SELECT USING (true);

-- Solo la administradora puede insertar, actualizar o eliminar.
CREATE POLICY "categorias_admin_write" ON categorias_servicio
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE categorias_servicio IS 'Categorías del catálogo de servicios (Uñas, Cejas, Pestañas).';
