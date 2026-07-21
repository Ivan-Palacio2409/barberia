-- ============================================================
-- 028_push_suscripciones.sql — Fase 30
-- Almacena las suscripciones Web Push de los clientes.
-- Una misma cuenta puede tener N dispositivos/navegadores.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_suscripciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Evitar duplicados por endpoint exacto por cliente
  UNIQUE (cliente_id, endpoint)
);

-- Indice para buscar por cliente
CREATE INDEX IF NOT EXISTS idx_push_suscripciones_cliente
  ON push_suscripciones (cliente_id);

-- RLS
ALTER TABLE push_suscripciones ENABLE ROW LEVEL SECURITY;

-- El propio cliente puede leer, insertar y borrar sus suscripciones.
-- La verificacion se hace via auth_user_id en la tabla clientes.
CREATE POLICY "cliente_read_own_push"
  ON push_suscripciones
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_insert_own_push"
  ON push_suscripciones
  FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_delete_own_push"
  ON push_suscripciones
  FOR DELETE
  USING (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE auth_user_id = auth.uid()
    )
  );

-- El admin puede leer todas (para envio de push desde servidor)
CREATE POLICY "admin_read_all_push"
  ON push_suscripciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );
