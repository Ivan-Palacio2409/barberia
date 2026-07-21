-- ============================================================
-- Migración 038: Transformación a FORMA — Peluquería
-- ------------------------------------------------------------
-- Este proyecto nació como un sistema de reservas para un
-- negocio de uñas/cejas/pestañas y se transforma en un sistema
-- de reservas para una peluquería de un solo profesional.
--
-- Principio aplicado (ver auditoría): no se destruye historial.
-- - Las tablas "disenos_*" se RENOMBRAN (ALTER TABLE ... RENAME),
--   lo que preserva IDs, filas, relaciones (FK) y RLS existentes.
-- - Los servicios semilla del negocio anterior se DESACTIVAN
--   (activo = false) en lugar de borrarse, porque pueden estar
--   referenciados por citas históricas (cita_servicios). Esto
--   respeta la integridad y el historial de negocio.
-- - Las categorías se RENOMBRAN in-place (mismo id), así que
--   cualquier fila que las referencia sigue siendo válida.
--
-- Es seguro ejecutar esta migración tanto sobre una base de
-- datos que ya corrió las migraciones 007/015/017/034 con los
-- nombres originales, como sobre una instalación nueva donde
-- esos archivos ya fueron actualizados con los nombres nuevos
-- (los bloques usan IF EXISTS / IF NOT EXISTS para ser idempotentes).
-- ============================================================

-- ── 1. Renombrado de tablas (idempotente) ────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'catalogo_disenos') THEN
    ALTER TABLE catalogo_disenos RENAME TO catalogo_estilos;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disenos_referencia') THEN
    ALTER TABLE disenos_referencia RENAME TO estilos_referencia;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disenos_favoritos') THEN
    ALTER TABLE disenos_favoritos RENAME TO estilos_favoritos;
  END IF;
END $$;

-- ── 2. Renombrado de columnas dependientes (idempotente) ─────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estilos_favoritos' AND column_name = 'catalogo_diseno_id'
  ) THEN
    ALTER TABLE estilos_favoritos RENAME COLUMN catalogo_diseno_id TO catalogo_estilo_id;
  END IF;
END $$;

-- ── 3. Comentarios actualizados ───────────────────────────────
COMMENT ON TABLE catalogo_estilos   IS 'Catálogo público de estilos (galería de inspiración de la peluquería).';
COMMENT ON TABLE estilos_referencia IS 'Imágenes de referencia adjuntadas por el cliente a una cita.';

-- ── 4. Renombrado de categorías de servicio (mismo id, sin romper FKs) ─
UPDATE categorias_servicio SET nombre = 'Cortes'        WHERE nombre = 'Uñas';
UPDATE categorias_servicio SET nombre = 'Barbería'      WHERE nombre = 'Cejas';
UPDATE categorias_servicio SET nombre = 'Tratamientos'  WHERE nombre = 'Pestañas';

-- Si la instalación es nueva y ya corrió con nombres de peluquería,
-- este bloque no encuentra filas y no hace nada (idempotente).

-- ── 5. Desactivar servicios semilla del negocio anterior ──────
-- No se eliminan por si existen citas históricas que los referencian.
UPDATE servicios SET activo = false
WHERE nombre IN (
  'Manicura tradicional', 'Semipermanente', 'Uñas acrílicas',
  'Decoración y nail art', 'Retoques',
  'Diseño de cejas', 'Depilación', 'Laminado', 'Pigmentación',
  'Extensiones clásicas', 'Volumen ruso', 'Lifting'
);

-- ── 6. Nuevos servicios de peluquería (idempotente por nombre) ─
INSERT INTO servicios (categoria_id, nombre, precio, duracion_minutos, activo)
SELECT c.id, s.nombre, s.precio, s.duracion, true
FROM categorias_servicio c
CROSS JOIN LATERAL (
  VALUES
    ('Cortes',       'Corte clásico',            35000, 40),
    ('Cortes',       'Corte a máquina',           25000, 25),
    ('Cortes',       'Corte infantil',            30000, 35),
    ('Barbería',     'Arreglo de barba',          25000, 25),
    ('Barbería',     'Corte + Barba',             55000, 60),
    ('Barbería',     'Afeitado clásico',          30000, 30),
    ('Tratamientos', 'Lavado y peinado',          20000, 20),
    ('Tratamientos', 'Tintura',                   70000, 75),
    ('Tratamientos', 'Tratamiento capilar',       60000, 45)
) AS s(categoria_nombre, nombre, precio, duracion)
WHERE c.nombre = s.categoria_nombre
  AND NOT EXISTS (
    SELECT 1 FROM servicios WHERE servicios.nombre = s.nombre
  );

COMMENT ON TABLE servicios IS 'Catálogo de servicios de la peluquería, agrupados por categoría (Cortes, Barbería, Tratamientos).';

-- ── 7. Actualizar nombre del negocio si quedó con el valor anterior ─
UPDATE configuracion_negocio
SET nombre = 'Peluquería FORMA'
WHERE nombre IN ('Centro de Belleza', 'NubiNails', 'NubiNails — Centro de Belleza');

