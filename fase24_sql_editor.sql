-- ============================================================
-- FORMA — Fase 24: RLS notificaciones cliente + admin
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. RLS notificaciones — cliente solo ve las suyas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notificaciones'
      AND policyname = 'notificaciones_cliente_select'
  ) THEN
    CREATE POLICY "notificaciones_cliente_select"
      ON notificaciones FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM clientes c
          WHERE c.id = notificaciones.cliente_id
            AND c.auth_user_id = auth.uid()
        )
      );
  END IF;

  -- 2. Admin puede leer y actualizar todas las notificaciones
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notificaciones'
      AND policyname = 'notificaciones_admin_select'
  ) THEN
    CREATE POLICY "notificaciones_admin_select"
      ON notificaciones FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notificaciones'
      AND policyname = 'notificaciones_admin_update'
  ) THEN
    CREATE POLICY "notificaciones_admin_update"
      ON notificaciones FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notificaciones'
      AND policyname = 'notificaciones_admin_insert'
  ) THEN
    CREATE POLICY "notificaciones_admin_insert"
      ON notificaciones FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 3. Realtime en notificaciones (para la campana del cliente en tiempo real)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
  END IF;
END $$;

-- Verificar
SELECT 'Fase 24 SQL aplicado correctamente' AS resultado;
