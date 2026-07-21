-- ============================================================
-- Migración 020: consentimientos
-- [C8] Cumplimiento Ley 1581/2012 y Decreto 1377/2013 (Colombia).
-- Audita los consentimientos explícitos del cliente: tratamiento
-- de datos personales y almacenamiento de fotografías. Cada
-- registro guarda versión del documento aceptado, IP y fecha,
-- requerido para sustentar el consentimiento ante una auditoría.
--
-- Nota de numeración: esta migración usa el número 020 desde la
-- Fase 3 (en lugar de continuar la secuencia 001-004) porque así
-- lo fija el plan de 30 fases, dejando el rango 005-019 reservado
-- para las tablas de fases posteriores (citas, pagos, storage,
-- horarios, notificaciones, reseñas, etc.).
-- ============================================================

CREATE TABLE consentimientos (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id          UUID         NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_consentimiento VARCHAR(50)  NOT NULL CHECK (tipo_consentimiento IN (
                        'tratamiento_datos', 'almacenamiento_fotografias')),
  version_documento   VARCHAR(20)  NOT NULL,  -- ej: 'privacidad-v1.0'
  aceptado            BOOLEAN      NOT NULL DEFAULT false,
  ip                  VARCHAR(45),            -- IPv4 o IPv6
  created_at          TIMESTAMP    DEFAULT now(),
  updated_at          TIMESTAMP    DEFAULT now()
);

CREATE INDEX idx_consentimientos_cliente ON consentimientos(cliente_id);
CREATE INDEX idx_consentimientos_tipo    ON consentimientos(tipo_consentimiento);

CREATE TRIGGER trg_consentimientos_updated_at
  BEFORE UPDATE ON consentimientos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;

-- El cliente ve únicamente sus propios consentimientos.
CREATE POLICY "consentimientos_own" ON consentimientos
  FOR SELECT USING (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- La inserción se realiza desde una server action con service role
-- (necesario para registrar consentimiento de clientes invitados,
-- que aún no tienen sesión autenticada).
CREATE POLICY "consentimientos_insert" ON consentimientos
  FOR INSERT WITH CHECK (true);

-- La administradora tiene acceso total para fines de auditoría.
CREATE POLICY "consentimientos_admin_all" ON consentimientos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE consentimientos IS 'Auditoría de consentimientos de tratamiento de datos y fotografías. [C8 - Ley 1581/2012]';
