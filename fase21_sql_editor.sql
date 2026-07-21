-- ============================================================
-- FORMA — Fase 21: Horarios especiales y Configuración
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. Tabla horarios_especiales
CREATE TABLE IF NOT EXISTS horarios_especiales (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha       DATE    NOT NULL UNIQUE,
  hora_inicio TIME    NOT NULL,
  hora_fin    TIME    NOT NULL,
  motivo      VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horarios_especiales_fecha
  ON horarios_especiales(fecha);

ALTER TABLE horarios_especiales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'horarios_especiales'
      AND policyname = 'horarios_especiales_select_publico'
  ) THEN
    CREATE POLICY "horarios_especiales_select_publico"
      ON horarios_especiales FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'horarios_especiales'
      AND policyname = 'horarios_especiales_admin_write'
  ) THEN
    CREATE POLICY "horarios_especiales_admin_write"
      ON horarios_especiales
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 2. Función para resolver el horario efectivo de una fecha
--    Devuelve el horario especial si existe; si no, el regular.
CREATE OR REPLACE FUNCTION get_horario_efectivo(p_fecha DATE)
RETURNS TABLE(
  hora_inicio TIME,
  hora_fin    TIME,
  es_especial BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(he.hora_inicio, ht.hora_inicio) AS hora_inicio,
    COALESCE(he.hora_fin,    ht.hora_fin)    AS hora_fin,
    he.id IS NOT NULL                         AS es_especial
  FROM
    (SELECT EXTRACT(DOW FROM p_fecha)::INTEGER AS dow) AS d
    LEFT JOIN horarios_trabajo ht
      ON ht.dia_semana = d.dow AND ht.activo = true
    LEFT JOIN horarios_especiales he
      ON he.fecha = p_fecha
  WHERE ht.id IS NOT NULL OR he.id IS NOT NULL
  LIMIT 1;
$$;

-- 3. RLS en horarios_trabajo y dias_bloqueados (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'horarios_trabajo'
      AND policyname = 'horarios_trabajo_admin_write'
  ) THEN
    CREATE POLICY "horarios_trabajo_admin_write"
      ON horarios_trabajo FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dias_bloqueados'
      AND policyname = 'dias_bloqueados_admin_write'
  ) THEN
    CREATE POLICY "dias_bloqueados_admin_write"
      ON dias_bloqueados FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- 4. RLS en configuracion_negocio (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'configuracion_negocio'
      AND policyname = 'configuracion_admin_write'
  ) THEN
    CREATE POLICY "configuracion_admin_write"
      ON configuracion_negocio FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.rol = 'administrador'
        )
      );
  END IF;
END $$;

-- Verificar instalación
SELECT 'Fase 21 SQL aplicado correctamente' AS resultado;
