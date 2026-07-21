-- ============================================================
-- Migración 035: permitir invitados en lista_espera.
-- Decisión de producto (M2, post fase 30): SÍ, un invitado sin
-- cuenta debe poder anotarse.
--
-- Evidencia de que el frontend ya estaba armado para esto y solo
-- faltaba la política: src/components/lista-espera/FormularioInvitado.tsx
-- y src/services/lista-espera.ts → crearClienteEInscribirse() ya
-- existían, listos para invitados. La única política de INSERT en
-- `lista_espera` (migración 011, "lista_espera_own") exige
-- `cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())`,
-- lo cual es imposible de cumplir para un invitado (auth.uid() es
-- NULL en una sesión anónima) — por eso la inscripción de invitados
-- fallaba por RLS antes de esta migración.
--
-- Mismo patrón que la migración 030 para `citas`/`clientes`.
-- ============================================================

DROP POLICY IF EXISTS "invitado_insert_lista_espera" ON lista_espera;
CREATE POLICY "invitado_insert_lista_espera" ON lista_espera
  FOR INSERT
  TO public
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE auth_user_id = auth.uid() OR auth_user_id IS NULL
    )
  );

COMMENT ON POLICY "invitado_insert_lista_espera" ON lista_espera IS
  'M2 (post fase 30): permite que un invitado (auth_user_id IS NULL) se inscriba en la lista de espera, igual que ya puede reservar una cita completa sin cuenta.';
