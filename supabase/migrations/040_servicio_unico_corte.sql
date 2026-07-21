-- ============================================================
-- Migración 040: Servicio único — Corte
-- ------------------------------------------------------------
-- La barbería pasa a ofrecer un solo servicio. Siguiendo el
-- mismo criterio de la migración 038 (no se destruye historial),
-- los servicios anteriores se DESACTIVAN (activo = false) en
-- lugar de borrarse, porque pueden estar referenciados por citas
-- históricas (cita_servicios). Se crea (o reactiva) el único
-- servicio vigente: "Corte", $18.000, 30 minutos.
--
-- Idempotente: se puede ejecutar más de una vez sin duplicar
-- filas ni romper nada.
-- ============================================================

-- ── 1. Desactivar todos los servicios activos actuales ────────
UPDATE servicios SET activo = false WHERE activo = true;

-- ── 2. Crear o actualizar el servicio único "Corte" ────────────
DO $$
DECLARE
  v_categoria_id UUID;
BEGIN
  SELECT id INTO v_categoria_id
  FROM categorias_servicio
  WHERE nombre = 'Cortes'
  LIMIT 1;

  IF v_categoria_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría "Cortes"';
  END IF;

  IF EXISTS (SELECT 1 FROM servicios WHERE nombre = 'Corte') THEN
    UPDATE servicios
    SET precio           = 18000,
        duracion_minutos = 30,
        categoria_id     = v_categoria_id,
        activo           = true
    WHERE nombre = 'Corte';
  ELSE
    INSERT INTO servicios (categoria_id, nombre, precio, duracion_minutos, activo)
    VALUES (v_categoria_id, 'Corte', 18000, 30, true);
  END IF;
END $$;

COMMENT ON TABLE servicios IS 'Catálogo de servicios de la peluquería. Actualmente ofrece un único servicio: Corte ($18.000, 30 min).';
