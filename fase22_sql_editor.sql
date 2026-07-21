-- ============================================================
-- FORMA — Fase 22: RLS para resenas y pagos (admin)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. RLS resenas — admin puede eliminar, publico puede leer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'resenas'
      AND policyname = 'resenas_admin_delete'
  ) THEN
    CREATE POLICY "resenas_admin_delete"
      ON resenas FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;

  -- Admin puede leer todas las resenas (con datos de cliente)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'resenas'
      AND policyname = 'resenas_admin_select'
  ) THEN
    CREATE POLICY "resenas_admin_select"
      ON resenas FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 2. RLS pagos — admin puede leer todos los pagos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pagos'
      AND policyname = 'pagos_admin_select'
  ) THEN
    CREATE POLICY "pagos_admin_select"
      ON pagos FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 3. Vista agregada de ingresos por mes (opcional — mejora el rendimiento)
CREATE OR REPLACE VIEW ingresos_por_mes AS
SELECT
  to_char(date_trunc('month', fecha_pago::timestamptz), 'YYYY-MM') AS mes,
  SUM(monto) FILTER (WHERE estado = 'pagado')  AS total_pagado,
  SUM(monto) FILTER (WHERE estado = 'pendiente') AS total_pendiente,
  COUNT(*) FILTER (WHERE estado = 'pagado')    AS count_pagados,
  COUNT(*) FILTER (WHERE estado = 'pendiente') AS count_pendientes
FROM pagos
GROUP BY 1
ORDER BY 1 DESC;

-- Verificar
SELECT 'Fase 22 SQL aplicado correctamente' AS resultado;
