-- ============================================================
-- FORMA — Fase 15: Reseñas y sugerencias
-- Ejecutar en: Supabase SQL Editor
-- ============================================================
-- Las tablas resenas (013) y sugerencias (014) ya existen.
-- Este script aplica ajustes necesarios para la Fase 15.
-- ============================================================

-- 1. Restricción: un cliente solo puede dejar UNA reseña.
--    Si ya existe este constraint, el script lo ignorará.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_resenas_cliente'
  ) THEN
    ALTER TABLE resenas
      ADD CONSTRAINT uq_resenas_cliente UNIQUE (cliente_id);
  END IF;
END;
$$;

-- 2. Índice adicional para ordenar reseñas por fecha eficientemente.
CREATE INDEX IF NOT EXISTS idx_resenas_created_at
  ON resenas(created_at DESC);

-- 3. Índice adicional para sugerencias por fecha.
CREATE INDEX IF NOT EXISTS idx_sugerencias_created_at
  ON sugerencias(created_at DESC);

-- 4. Verificación: mostrar las tablas y sus políticas RLS.
SELECT
  t.tablename,
  p.policyname,
  p.cmd,
  p.qual
FROM pg_tables t
JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.tablename IN ('resenas', 'sugerencias')
  AND t.schemaname = 'public'
ORDER BY t.tablename, p.policyname;
