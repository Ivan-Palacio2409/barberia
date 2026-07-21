-- ============================================================
-- Migración 011: lista_espera
-- Clientes que quieren una fecha sin disponibilidad y esperan
-- a que se libere un cupo (ej. por cancelación de otra cita).
-- ============================================================

CREATE TABLE lista_espera (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id         UUID         NOT NULL REFERENCES clientes(id),
  fecha_solicitada   DATE         NOT NULL,
  servicios_deseados TEXT,
  estado             VARCHAR(20)  NOT NULL DEFAULT 'en_espera'
                                  CHECK (estado IN ('en_espera', 'notificado', 'convertido', 'cancelado')),
  created_at         TIMESTAMP    DEFAULT now()
);

CREATE INDEX idx_lista_espera_cliente ON lista_espera(cliente_id);
CREATE INDEX idx_lista_espera_fecha   ON lista_espera(fecha_solicitada);
CREATE INDEX idx_lista_espera_estado  ON lista_espera(estado);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

-- El cliente ve y crea únicamente sus propias solicitudes.
CREATE POLICY "lista_espera_own" ON lista_espera
  FOR ALL USING (
    cliente_id IN (SELECT id FROM clientes WHERE auth_user_id = auth.uid())
  );

-- La administradora tiene acceso total (gestión de la lista).
CREATE POLICY "lista_espera_admin_all" ON lista_espera
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE lista_espera IS 'Solicitudes de clientes para fechas sin disponibilidad, a la espera de un cupo.';
