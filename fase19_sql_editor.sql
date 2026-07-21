-- ============================================================
-- FORMA — Fase 19: Detalle de cita y gestión de clientes
-- SQL Editor Supabase
-- No hay migraciones de tablas nuevas en esta fase.
-- Solo ajustes de políticas RLS para que el admin pueda leer
-- datos de citas y clientes con joins completos.
-- ============================================================

-- 1. Asegurarse que admin puede leer estilos_referencia
--    (necesario para GaleriaReferencia y GaleriaEstilos).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'estilos_referencia'
      AND policyname = 'Admin puede leer estilos_referencia'
  ) THEN
    CREATE POLICY "Admin puede leer estilos_referencia"
      ON estilos_referencia
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 2. Asegurarse que admin puede leer todos los clientes
--    (el SELECT público ya debería existir, pero lo creamos
--     condicionalmente para el admin con datos completos).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clientes'
      AND policyname = 'Admin puede leer todos los clientes'
  ) THEN
    CREATE POLICY "Admin puede leer todos los clientes"
      ON clientes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 3. Asegurarse que admin puede actualizar observaciones de clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clientes'
      AND policyname = 'Admin puede actualizar clientes'
  ) THEN
    CREATE POLICY "Admin puede actualizar clientes"
      ON clientes
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 4. Verificar que RLS esta activo en estilos_referencia
ALTER TABLE estilos_referencia ENABLE ROW LEVEL SECURITY;

-- 5. Función auxiliar para calcular frecuencia de un cliente
--    (útil para queries desde server components si se prefiere SQL).
CREATE OR REPLACE FUNCTION get_cliente_frecuencia(p_cliente_id UUID)
RETURNS TABLE(
  total_completadas BIGINT,
  es_frecuente BOOLEAN,
  dias_desde_ultima_visita INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) FILTER (WHERE estado = 'completada') AS total_completadas,
    COUNT(*) FILTER (WHERE estado = 'completada') >= 3 AS es_frecuente,
    COALESCE(
      EXTRACT(DAY FROM now() - MAX(fecha::date) FILTER (WHERE estado = 'completada'))::INTEGER,
      999
    ) AS dias_desde_ultima_visita
  FROM citas
  WHERE cliente_id = p_cliente_id;
$$;

-- Verificar instalacion
SELECT 'Fase 19 SQL aplicado correctamente' AS resultado;
