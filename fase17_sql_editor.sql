-- ============================================================
-- FORMA — Fase 17: Dashboard administrativo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Garantizar que el administrador pueda leer todas las citas
-- (ya cubierto por 021_rls_mis_citas.sql, pero se confirma aqui)

-- Politica: admin puede leer todos los pagos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pagos' AND policyname = 'admin_pagos_select'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_pagos_select
        ON pagos FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.rol = 'administrador'
          )
        );
    $pol$;
  END IF;
END$$;

-- Politica: admin puede leer todos los clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clientes' AND policyname = 'admin_clientes_select'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_clientes_select
        ON clientes FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.rol = 'administrador'
          )
        );
    $pol$;
  END IF;
END$$;

-- Politica: admin puede actualizar estado de citas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'citas' AND policyname = 'admin_citas_update'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_citas_update
        ON citas FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.rol = 'administrador'
          )
        );
    $pol$;
  END IF;
END$$;

-- Politica: admin puede leer cita_servicios (para top servicios)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cita_servicios' AND policyname = 'admin_cita_servicios_select'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_cita_servicios_select
        ON cita_servicios FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.rol = 'administrador'
          )
        );
    $pol$;
  END IF;
END$$;

-- Verificar que RLS esta habilitado en todas las tablas relevantes
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cita_servicios ENABLE ROW LEVEL SECURITY;
