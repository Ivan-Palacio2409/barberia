-- ============================================================
-- Migración 037: rate limiter distribuido.
-- Auditoría enterprise — Revisión 4 (escalabilidad) / Revisión 9
-- (seguridad).
--
-- Evidencia: src/lib/rate-limit.ts usaba un `Map` en memoria del
-- proceso de Node. Funciona perfecto con un solo servidor, pero en
-- cualquier entorno serverless/multi-instancia real (Vercel con
-- varias funciones concurrentes, más de un contenedor, etc.) cada
-- instancia tiene su PROPIO contador — un atacante distribuido (o
-- simplemente tráfico repartido entre instancias por el balanceador)
-- puede terminar con N veces el límite real, donde N es la
-- cantidad de instancias activas.
--
-- Fix: mover el conteo a una tabla en Postgres (que es compartida
-- entre todas las instancias por definición) con una función
-- SECURITY DEFINER atómica — mismo principio que el EXCLUDE
-- constraint de la migración 031 contra overbooking: el INSERT ...
-- ON CONFLICT toma un lock de fila real, así que dos requests
-- concurrentes a la misma key nunca pueden "pisarse" el conteo.
--
-- No se eliminó rate-limit.ts (el limiter en memoria): se usa como
-- primera línea de defensa súper rápida (sin round-trip a la BD) y
-- el de Postgres como la verdad definitiva compartida — ver el
-- comentario en src/lib/rate-limit.ts.
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  count        integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Sin políticas RLS de SELECT/INSERT/UPDATE directas a propósito:
-- solo se accede a esta tabla a través de check_rate_limit_db()
-- (SECURITY DEFINER). Nadie —ni admin ni cliente— debería poder
-- leer o falsificar contadores directamente vía la API de Supabase.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_rate_limit_db(
  p_key            text,
  p_window_seconds integer,
  p_max            integer
) RETURNS boolean AS $$
DECLARE
  v_now   timestamptz := now();
  v_count integer;
BEGIN
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN rate_limits.window_start + (p_window_seconds || ' seconds')::interval < v_now
        THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start + (p_window_seconds || ' seconds')::interval < v_now
        THEN v_now
      ELSE rate_limits.window_start
    END
  RETURNING count INTO v_count;

  -- Limpieza oportunista: con baja probabilidad (~1 de cada 200
  -- llamadas), borra filas viejas para que la tabla no crezca sin
  -- límite. Evita necesitar un cron aparte solo para esto.
  IF random() < 0.005 THEN
    DELETE FROM rate_limits WHERE window_start < v_now - interval '1 day';
  END IF;

  RETURN v_count <= p_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Se ejecuta con el anon key desde Server Actions/Route Handlers
-- públicos (sin sesión de usuario todavía en ese punto del flujo).
GRANT EXECUTE ON FUNCTION check_rate_limit_db(text, integer, integer) TO anon, authenticated;

COMMENT ON FUNCTION check_rate_limit_db IS
  'Auditoría enterprise: rate limiting atómico compartido entre todas las instancias del servidor (a diferencia del Map en memoria de rate-limit.ts, que es por-instancia). Devuelve true si la request está permitida.';
