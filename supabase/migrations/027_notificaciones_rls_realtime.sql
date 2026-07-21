-- Fase 24: RLS notificaciones (cliente + admin) + Realtime notificaciones

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificaciones' AND policyname = 'notificaciones_cliente_select') THEN
    CREATE POLICY "notificaciones_cliente_select" ON notificaciones FOR SELECT
      USING (EXISTS (SELECT 1 FROM clientes c WHERE c.id = notificaciones.cliente_id AND c.auth_user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificaciones' AND policyname = 'notificaciones_admin_select') THEN
    CREATE POLICY "notificaciones_admin_select" ON notificaciones FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'administrador'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificaciones' AND policyname = 'notificaciones_admin_update') THEN
    CREATE POLICY "notificaciones_admin_update" ON notificaciones FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'administrador'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notificaciones' AND policyname = 'notificaciones_admin_insert') THEN
    CREATE POLICY "notificaciones_admin_insert" ON notificaciones FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'administrador'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notificaciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
  END IF;
END $$;
