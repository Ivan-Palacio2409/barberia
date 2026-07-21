-- ============================================================
-- Migración 015: catalogo_estilos
-- Catálogo público de diseños de uñas/cejas/pestañas que el
-- negocio muestra como inspiración (galería). No confundir con
-- estilos_referencia (Fase 4), que son las imágenes que sube el
-- cliente para su propia cita.
-- ============================================================

CREATE TABLE catalogo_estilos (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo             VARCHAR(100)  NOT NULL,
  categoria_id       UUID          NOT NULL REFERENCES categorias_servicio(id),
  imagen_url         TEXT          NOT NULL,
  precio_referencia  DECIMAL(10,2),
  destacado          BOOLEAN       NOT NULL DEFAULT false
);

CREATE INDEX idx_catalogo_estilos_categoria  ON catalogo_estilos(categoria_id);
CREATE INDEX idx_catalogo_estilos_destacado  ON catalogo_estilos(destacado);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE catalogo_estilos ENABLE ROW LEVEL SECURITY;

-- Lectura pública: la galería es visible para cualquier visitante.
CREATE POLICY "catalogo_estilos_select_publico" ON catalogo_estilos
  FOR SELECT USING (true);

-- Solo la administradora puede agregar o editar diseños del catálogo.
CREATE POLICY "catalogo_estilos_admin_write" ON catalogo_estilos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE catalogo_estilos IS 'Catálogo público de diseños (galería de inspiración del negocio).';
