-- ============================================================
-- FASE 27 — Mostrar el servicio reseñado en admin y portal publico
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Contexto: la Fase 26 agrego resenas.cita_id, pero las politicas
-- RLS de "citas" y "cita_servicios" solo permiten lectura al
-- cliente dueño de la cita o al administrador. Eso significa que
-- el join resenas -> citas -> cita_servicios devuelve NULL para
-- cualquier visitante del portal publico (incluyendo otros
-- clientes autenticados), y el badge "servicio reseñado" no
-- llegaria a mostrarse fuera del panel admin o del propio cliente.
--
-- Este script agrega una politica de SELECT adicional: una cita
-- es visible si tiene al menos una resena asociada (resenas es de
-- lectura publica desde la Fase 1, ver migracion 013_resenas.sql).
-- No se expone nada nuevo: cualquiera que vea una resena publica ya
-- puede inferir que esa cita existio; esta politica solo permite
-- leer fecha/servicio de esa misma cita para enriquecer la vista.
-- ============================================================

-- 1. citas: visibles si estan vinculadas a una resena
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'citas' AND policyname = 'citas_select_con_resena_publica'
  ) THEN
    CREATE POLICY "citas_select_con_resena_publica"
      ON citas
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM resenas r WHERE r.cita_id = citas.id
        )
      );
  END IF;
END $$;

-- 2. cita_servicios: visibles si la cita padre esta vinculada a una resena
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cita_servicios' AND policyname = 'cita_servicios_select_con_resena_publica'
  ) THEN
    CREATE POLICY "cita_servicios_select_con_resena_publica"
      ON cita_servicios
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM resenas r WHERE r.cita_id = cita_servicios.cita_id
        )
      );
  END IF;
END $$;

