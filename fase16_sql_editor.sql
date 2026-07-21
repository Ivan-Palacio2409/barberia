-- ============================================================
-- FORMA — Fase 16: Lista de espera (cliente)
-- Ejecutar en: Supabase SQL Editor
-- ============================================================
-- La tabla lista_espera (migración 011) ya existe con RLS.
-- Este script verifica y agrega ajustes menores para la Fase 16.
-- ============================================================

-- 1. Política INSERT para invitados (server action con service role).
--    La política existente "lista_espera_own" cubre SELECT/UPDATE/DELETE
--    para clientes autenticados. Para INSERT de invitados se usa
--    service_role desde el Server Action, por lo que no requiere
--    política adicional de cliente.
--    Solo verificamos que la política exista:
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'lista_espera'
ORDER BY policyname;

-- 2. Índice de fecha para consultas de administración (Fase 26).
CREATE INDEX IF NOT EXISTS idx_lista_espera_fecha_estado
  ON lista_espera(fecha_solicitada, estado);

-- 3. Verificar estructura de la tabla.
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lista_espera'
  AND table_schema = 'public'
ORDER BY ordinal_position;
