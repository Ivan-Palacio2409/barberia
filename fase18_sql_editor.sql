-- ============================================================
-- FORMA — Fase 18: Calendario con Realtime
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar Realtime en tabla citas
-- (si ya esta habilitado el comando no falla)
ALTER PUBLICATION supabase_realtime ADD TABLE citas;

-- Politica RLS adicional: admin puede leer todas las citas
-- (puede que ya exista de fase anterior, se usa IF NOT EXISTS via DO)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'citas' AND policyname = 'admin_citas_select'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_citas_select
        ON citas FOR SELECT
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

-- Politica: admin puede insertar citas (creacion manual)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'citas' AND policyname = 'admin_citas_insert'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_citas_insert
        ON citas FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.rol = 'administrador'
          )
        );
    $pol$;
  END IF;
END$$;

-- Politica: admin puede insertar cita_servicios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cita_servicios' AND policyname = 'admin_cita_servicios_insert'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_cita_servicios_insert
        ON cita_servicios FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.rol = 'administrador'
          )
        );
    $pol$;
  END IF;
END$$;

-- ============================================================
-- PASO MANUAL REQUERIDO en el Dashboard de Supabase:
--   Database > Replication > Realtime
--   Activar la tabla "citas" para que lleguen los eventos
--   postgres_changes al cliente.
-- ============================================================
