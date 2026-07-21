-- ============================================================
-- Migración 004: servicios
-- Catálogo de servicios ofrecidos, agrupados por categoría.
-- 13 servicios semilla: 5 de Uñas, 4 de Cejas, 4 de Pestañas.
-- ============================================================

CREATE TABLE servicios (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id      UUID          NOT NULL REFERENCES categorias_servicio(id),
  nombre            VARCHAR(100)  NOT NULL,
  descripcion       TEXT,
  precio            DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  duracion_minutos  INTEGER       NOT NULL CHECK (duracion_minutos > 0),
  activo            BOOLEAN       NOT NULL DEFAULT true,
  created_at        TIMESTAMP     DEFAULT now()
);

CREATE INDEX idx_servicios_categoria ON servicios(categoria_id);
CREATE INDEX idx_servicios_activo    ON servicios(activo);

-- ── Seeds: Uñas (5 servicios) ─────────────────────────────────
INSERT INTO servicios (categoria_id, nombre, precio, duracion_minutos)
SELECT id, unnest(ARRAY[
         'Manicura tradicional',
         'Semipermanente',
         'Uñas acrílicas',
         'Decoración y nail art',
         'Retoques'
       ]),
       unnest(ARRAY[25000, 45000, 80000, 60000, 30000]::DECIMAL[]),
       unnest(ARRAY[60, 75, 120, 90, 45]::INTEGER[])
FROM categorias_servicio WHERE nombre = 'Uñas';

-- ── Seeds: Cejas (4 servicios) ────────────────────────────────
INSERT INTO servicios (categoria_id, nombre, precio, duracion_minutos)
SELECT id, unnest(ARRAY[
         'Diseño de cejas',
         'Depilación',
         'Laminado',
         'Pigmentación'
       ]),
       unnest(ARRAY[20000, 15000, 55000, 120000]::DECIMAL[]),
       unnest(ARRAY[30, 20, 60, 90]::INTEGER[])
FROM categorias_servicio WHERE nombre = 'Cejas';

-- ── Seeds: Pestañas (4 servicios) ─────────────────────────────
INSERT INTO servicios (categoria_id, nombre, precio, duracion_minutos)
SELECT id, unnest(ARRAY[
         'Extensiones clásicas',
         'Volumen ruso',
         'Lifting',
         'Retoques'
       ]),
       unnest(ARRAY[90000, 120000, 70000, 40000]::DECIMAL[]),
       unnest(ARRAY[120, 150, 75, 60]::INTEGER[])
FROM categorias_servicio WHERE nombre = 'Pestañas';

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquier visitante ve los servicios activos.
CREATE POLICY "servicios_select_publico" ON servicios
  FOR SELECT USING (true);

-- Solo la administradora puede crear, editar o desactivar servicios.
CREATE POLICY "servicios_admin_write" ON servicios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE servicios IS 'Catálogo de servicios ofrecidos por categoría, con precio y duración.';
