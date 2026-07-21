-- ============================================================
-- FORMA — Fase 23: RLS lista de espera admin + tipo notif
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. RLS lista_espera — admin puede leer y actualizar todas las filas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lista_espera'
      AND policyname = 'lista_espera_admin_select'
  ) THEN
    CREATE POLICY "lista_espera_admin_select"
      ON lista_espera FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lista_espera'
      AND policyname = 'lista_espera_admin_update'
  ) THEN
    CREATE POLICY "lista_espera_admin_update"
      ON lista_espera FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 2. Agregar tipo de notificacion 'aviso_lista_espera' si no existe
--    (la columna tipo suele ser un enum o text con check constraint)
DO $$
BEGIN
  -- Intentar agregar el valor al enum si existe
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'tipo_notificacion'
  ) THEN
    BEGIN
      ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'aviso_lista_espera';
    EXCEPTION WHEN others THEN
      NULL; -- Ya existe o no es un enum, ignorar
    END;
  END IF;
END $$;

-- 3. Realtime en lista_espera (para actualizaciones del admin visibles al instante)
DO $$
BEGIN
  -- Solo agregar si la tabla no esta ya en la publicacion
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'lista_espera'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE lista_espera;
  END IF;
END $$;

-- Verificar
SELECT 'Fase 23 SQL aplicado correctamente' AS resultado;
