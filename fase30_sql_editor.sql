-- ============================================================
-- fase30_sql_editor.sql
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor).
-- Crea la tabla push_suscripciones y sus politicas RLS.
-- Idempotente: usa IF NOT EXISTS y CREATE POLICY solo si no existe.
-- ============================================================

-- 1. Tabla
CREATE TABLE IF NOT EXISTS push_suscripciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, endpoint)
);

-- 2. Indice
CREATE INDEX IF NOT EXISTS idx_push_suscripciones_cliente
  ON push_suscripciones (cliente_id);

-- 3. RLS
ALTER TABLE push_suscripciones ENABLE ROW LEVEL SECURITY;

-- 4. Politicas (DROP + CREATE para idempotencia)
DROP POLICY IF EXISTS "cliente_read_own_push"     ON push_suscripciones;
DROP POLICY IF EXISTS "cliente_insert_own_push"   ON push_suscripciones;
DROP POLICY IF EXISTS "cliente_delete_own_push"   ON push_suscripciones;
DROP POLICY IF EXISTS "admin_read_all_push"       ON push_suscripciones;

CREATE POLICY "cliente_read_own_push"
  ON push_suscripciones FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_insert_own_push"
  ON push_suscripciones FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_delete_own_push"
  ON push_suscripciones FOR DELETE
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "admin_read_all_push"
  ON push_suscripciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );

-- Verificacion
SELECT 'push_suscripciones creada correctamente' AS resultado;
