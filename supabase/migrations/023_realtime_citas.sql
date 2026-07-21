-- ============================================================
-- 023_realtime_citas.sql — Fase 18
-- Habilita Realtime en la tabla citas.
--
-- NOTA: La activacion de Realtime tambien requiere ir a:
--   Supabase Dashboard > Database > Replication
--   y activar la tabla "citas" en el canal postgres_changes.
-- Este script habilita la publicacion a nivel de SQL.
-- ============================================================

-- Agregar tabla citas a la publicacion de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE citas;
