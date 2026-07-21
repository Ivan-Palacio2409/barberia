-- ============================================================
-- Migración 029: get_clientes_con_frecuencia()
-- Auditoría de calidad (post fase 30) — hallazgo H2.
--
-- Antes, src/services/clientes.ts traía TODOS los clientes con
-- un JOIN a citas(id, estado, fecha) (hasta un límite fijo de
-- 500, sin paginación real) y calculaba total_citas / es_frecuente
-- / inactivo iterando en JavaScript. Pasado ese límite, clientes
-- reales dejaban de aparecer en el listado sin ningún aviso.
--
-- Esta función mueve el cálculo a SQL (agregando sobre citas por
-- cliente en una sola pasada) y agrega paginación real via
-- LIMIT/OFFSET, devolviendo el total de clientes en total_count
-- para poder mostrar "mostrando X de N" y construir controles de
-- Anterior/Siguiente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_clientes_con_frecuencia(
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id                  uuid,
  auth_user_id        uuid,
  nombre              varchar,
  telefono            varchar,
  email               varchar,
  fecha_ultima_visita date,
  observaciones       text,
  created_at          timestamp,
  updated_at          timestamp,
  total_citas         bigint,
  es_frecuente        boolean,
  inactivo            boolean,
  total_count         bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Misma regla que la política RLS "clientes_admin_all": solo
  -- la administradora puede ver el listado completo de clientes.
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.rol = 'administrador'
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      ci.cliente_id,
      COUNT(*) FILTER (WHERE ci.estado = 'completada')        AS total_citas,
      MAX(ci.fecha) FILTER (WHERE ci.estado = 'completada')   AS ultima_completada
    FROM citas ci
    GROUP BY ci.cliente_id
  )
  SELECT
    c.id,
    c.auth_user_id,
    c.nombre,
    c.telefono,
    c.email,
    c.fecha_ultima_visita,
    c.observaciones,
    c.created_at,
    c.updated_at,
    COALESCE(s.total_citas, 0)                                            AS total_citas,
    COALESCE(s.total_citas, 0) >= 3                                       AS es_frecuente,
    (s.ultima_completada IS NULL
      OR s.ultima_completada < (CURRENT_DATE - INTERVAL '60 days'))       AS inactivo,
    COUNT(*) OVER ()                                                      AS total_count
  FROM clientes c
  LEFT JOIN stats s ON s.cliente_id = c.id
  ORDER BY c.nombre ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_clientes_con_frecuencia(integer, integer) TO authenticated;

COMMENT ON FUNCTION public.get_clientes_con_frecuencia IS
  'Lista paginada de clientes con total_citas/es_frecuente/inactivo calculados en SQL. Solo administradora. Auditoría fase 30 (H2).';
