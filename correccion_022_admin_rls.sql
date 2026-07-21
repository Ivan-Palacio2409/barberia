-- ============================================================
-- CORRECCION — supabase/migrations/022_admin_rls.sql (Fase 17)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- El archivo original usaba "CREATE POLICY IF NOT EXISTS", que
-- no es sintaxis valida en PostgreSQL (a diferencia de CREATE
-- TABLE / CREATE INDEX). Es probable que esta migracion nunca
-- se haya aplicado con exito. Este script crea las mismas 4
-- politicas con un guard idempotente correcto: se puede ejecutar
-- varias veces sin error, ya sea que las politicas existan o no.
-- ============================================================

DO $$
BEGIN
  -- Admin puede leer todos los pagos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pagos' AND policyname = 'admin_pagos_select'
  ) THEN
    CREATE POLICY admin_pagos_select
      ON pagos FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;

  -- Admin puede leer todos los clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clientes' AND policyname = 'admin_clientes_select'
  ) THEN
    CREATE POLICY admin_clientes_select
      ON clientes FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;

  -- Admin puede actualizar estado de citas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'citas' AND policyname = 'admin_citas_update'
  ) THEN
    CREATE POLICY admin_citas_update
      ON citas FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;

  -- Admin puede leer cita_servicios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cita_servicios' AND policyname = 'admin_cita_servicios_select'
  ) THEN
    CREATE POLICY admin_cita_servicios_select
      ON cita_servicios FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.rol = 'administrador'
        )
      );
  END IF;
END $$;
