-- ============================================================
-- FORMA — Fase 14: Diseños favoritos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla estilos_favoritos
CREATE TABLE IF NOT EXISTS estilos_favoritos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  catalogo_estilo_id UUID NOT NULL REFERENCES catalogo_estilos(id) ON DELETE CASCADE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (cliente_id, catalogo_estilo_id)
);

-- RLS
ALTER TABLE estilos_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_ve_sus_favoritos"
  ON estilos_favoritos FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_agrega_favorito"
  ON estilos_favoritos FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_elimina_favorito"
  ON estilos_favoritos FOR DELETE
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "admin_acceso_favoritos"
  ON estilos_favoritos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );
