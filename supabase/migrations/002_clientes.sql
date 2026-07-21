-- ============================================================
-- Migración 002: clientes
-- [C2] Modelo unificado de clientes. Una única tabla cubre los
-- tres escenarios de reserva: cliente autenticado, cliente
-- invitado (sin cuenta) y cliente que llega por Google OAuth.
-- `auth_user_id` es nullable: solo se rellena cuando el cliente
-- tiene cuenta. La función `conciliar_cliente_con_auth` enlaza
-- un registro de invitado con una cuenta nueva cuando coincide
-- el email o el teléfono, evitando registros duplicados.
-- ============================================================

CREATE TABLE clientes (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id        UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre              VARCHAR(100) NOT NULL,
  telefono            VARCHAR(20)  NOT NULL,
  email               VARCHAR(150),
  fecha_ultima_visita DATE,
  observaciones       TEXT,
  created_at          TIMESTAMP    DEFAULT now(),
  updated_at          TIMESTAMP    DEFAULT now(),
  CONSTRAINT uq_clientes_auth_user UNIQUE (auth_user_id)
);

CREATE INDEX idx_clientes_auth_user ON clientes(auth_user_id);
CREATE INDEX idx_clientes_telefono  ON clientes(telefono);
CREATE INDEX idx_clientes_email     ON clientes(email);

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Función de conciliación [C2] ──────────────────────────────
-- Busca un cliente invitado existente por email o teléfono.
-- Si lo encuentra, lo vincula a la cuenta nueva (auth_user_id).
-- Si no, crea un cliente nuevo ya vinculado.
-- SECURITY DEFINER porque se invoca tras el registro, antes de
-- que existan políticas RLS aplicables al usuario nuevo.
CREATE OR REPLACE FUNCTION conciliar_cliente_con_auth(
  p_auth_user_id UUID,
  p_email        VARCHAR,
  p_telefono     VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM clientes
  WHERE (email = p_email OR telefono = p_telefono)
    AND auth_user_id IS NULL
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE clientes
    SET auth_user_id = p_auth_user_id, updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO clientes (auth_user_id, nombre, email, telefono)
    VALUES (p_auth_user_id, p_email, p_email, COALESCE(p_telefono, ''))
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- El cliente autenticado ve únicamente su propio registro.
CREATE POLICY "clientes_own" ON clientes
  FOR SELECT USING (auth_user_id = auth.uid());

-- La administradora tiene acceso total (lectura y escritura).
CREATE POLICY "clientes_admin_all" ON clientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE clientes IS 'Clientes unificados (autenticados e invitados). auth_user_id nullable. [C2]';
COMMENT ON FUNCTION conciliar_cliente_con_auth IS 'Vincula un cliente invitado con una cuenta nueva por email/teléfono. [C2]';
