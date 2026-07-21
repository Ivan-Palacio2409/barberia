-- ============================================================
-- Migración 032: restringir qué puede modificar un cliente en
-- su propia cita.
-- QA (post fase 30) — hallazgo CRÍTICO #3.
--
-- Evidencia: la política "cliente_update_propias_citas"
-- (migración 021) permite a un cliente autenticado hacer UPDATE
-- de CUALQUIER columna de su propia fila en `citas`, siempre que
-- cliente_id siga siendo suyo. El código de la app
-- (src/lib/citas/index.ts) solo actualiza estado/fecha/hora desde
-- la UI, pero eso es una restricción de la interfaz, no de la
-- base de datos: cualquier persona con sesión iniciada puede
-- abrir la consola del navegador y ejecutar, por ejemplo:
--   supabase.from('citas').update({ precio_total: 0 })
--     .eq('id', 'MI_CITA_ID')
-- o marcar su propia cita como 'completada' directamente,
-- disparando el trigger update_fecha_ultima_visita() y alterando
-- su propio estado de "cliente frecuente" sin que el salón haya
-- prestado el servicio.
--
-- Fix: un trigger BEFORE UPDATE que, cuando quien actualiza NO es
-- administradora, sólo permite:
--   - cambiar estado hacia 'pendiente' o 'cancelada' (nunca a
--     'confirmada' ni 'completada', que son transiciones que le
--     corresponden al salón).
--   - cambiar fecha/hora_inicio/hora_fin (reagendamiento), pero
--     no a una fecha pasada.
--   - nunca cambiar precio_total, cliente_id ni notas.
-- Las conexiones de service role (auth.uid() IS NULL, ej. scripts
-- internos) quedan exentas, igual que ya quedan exentas de RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_client_cita_update()
RETURNS TRIGGER AS $$
DECLARE
  v_es_admin boolean;
BEGIN
  -- Conexiones de service role (sin JWT de usuario) y administradoras
  -- no tienen restricciones adicionales aquí (RLS ya las cubre).
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'administrador'
  ) INTO v_es_admin;

  IF v_es_admin THEN
    RETURN NEW;
  END IF;

  -- Un cliente no puede tocar el precio, reasignar la cita ni
  -- editar las notas (esas son del negocio).
  IF NEW.precio_total IS DISTINCT FROM OLD.precio_total THEN
    RAISE EXCEPTION 'No tienes permiso para modificar el precio de la cita.';
  END IF;

  IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id THEN
    RAISE EXCEPTION 'No tienes permiso para reasignar esta cita.';
  END IF;

  IF NEW.notas IS DISTINCT FROM OLD.notas THEN
    RAISE EXCEPTION 'No tienes permiso para modificar las notas de la cita.';
  END IF;

  -- No se puede tocar una cita ya completada.
  IF OLD.estado = 'completada' THEN
    RAISE EXCEPTION 'No se puede modificar una cita completada.';
  END IF;

  -- Solo puede llevarla a 'pendiente' (reagendar) o 'cancelada'.
  -- Nunca puede auto-confirmarse ni auto-completarse.
  IF NEW.estado NOT IN ('pendiente', 'cancelada') THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar la cita a ese estado.';
  END IF;

  -- No se puede reagendar hacia una fecha pasada.
  IF NEW.fecha < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se puede reagendar a una fecha pasada.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_enforce_client_cita_update ON citas;

CREATE TRIGGER trigger_enforce_client_cita_update
  BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION enforce_client_cita_update();

COMMENT ON FUNCTION public.enforce_client_cita_update IS
  'QA fase 30: evita que un cliente autenticado, llamando directo a Supabase desde el navegador, modifique precio/cliente_id/notas o transicione su propia cita a confirmada/completada.';
