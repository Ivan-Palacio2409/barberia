-- ============================================================
-- FASE 26 — Resenas por cita desde portal del cliente
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna cita_id a resenas (nullable para mantener
--    compatibilidad con resenas existentes sin cita asociada)
ALTER TABLE resenas
  ADD COLUMN IF NOT EXISTS cita_id UUID REFERENCES citas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resenas_cita ON resenas(cita_id);

-- 2. Constraint: un cliente solo puede dejar UNA resena por cita
--    (solo aplica cuando cita_id no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_resenas_cliente_cita
  ON resenas(cliente_id, cita_id)
  WHERE cita_id IS NOT NULL;

-- 3. Actualizar politica de INSERT para incluir cita_id
--    (la politica existente ya cubre esto via cliente_id;
--    el unique index hace el resto)

-- 4. Funcion helper: verificar si una cita ya tiene resena
CREATE OR REPLACE FUNCTION tiene_resena_para_cita(p_cita_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM resenas WHERE cita_id = p_cita_id
  );
$$;

GRANT EXECUTE ON FUNCTION tiene_resena_para_cita(UUID) TO authenticated;
