-- ============================================================
-- FASE 25 — Reportes avanzados: vista reporte_servicios_periodo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Vista: ingresos y frecuencia por servicio en un periodo
-- Se usa desde getReportePorServicio() pasando las fechas como filtro.
-- La vista expone todos los registros; el filtro de fechas va en la query.
CREATE OR REPLACE VIEW reporte_servicios_periodo AS
SELECT
  s.id                            AS servicio_id,
  s.nombre                        AS servicio_nombre,
  cs.nombre                       AS categoria_nombre,
  COUNT(cit.id)                   AS total_citas,
  SUM(CASE WHEN cit.estado = 'completada' THEN 1 ELSE 0 END) AS citas_completadas,
  COALESCE(SUM(CASE WHEN cit.estado = 'completada' THEN s.precio ELSE 0 END), 0) AS ingresos_generados,
  ROUND(AVG(CASE WHEN cit.estado = 'completada' THEN s.precio END)::numeric, 0) AS precio_promedio,
  MAX(cit.fecha)                  AS ultima_cita
FROM servicios s
JOIN categorias_servicio cs       ON cs.id = s.categoria_id
LEFT JOIN cita_servicios citsv    ON citsv.servicio_id = s.id
LEFT JOIN citas cit               ON cit.id = citsv.cita_id
WHERE s.activo = true
GROUP BY s.id, s.nombre, cs.nombre
ORDER BY total_citas DESC;

-- Permitir lectura a roles autenticados con rol admin
-- (la RLS de la tabla citas/servicios ya protege los datos base)
GRANT SELECT ON reporte_servicios_periodo TO authenticated;
