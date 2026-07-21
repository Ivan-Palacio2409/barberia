-- Fase 23: RLS admin lista_espera + Realtime lista_espera

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lista_espera' AND policyname = 'lista_espera_admin_select'
  ) THEN
    CREATE POLICY "lista_espera_admin_select" ON lista_espera FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'administrador'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lista_espera' AND policyname = 'lista_espera_admin_update'
  ) THEN
    CREATE POLICY "lista_espera_admin_update" ON lista_espera FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'administrador'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_notificacion') THEN
    BEGIN
      ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'aviso_lista_espera';
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'lista_espera'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE lista_espera;
  END IF;
END $$;
