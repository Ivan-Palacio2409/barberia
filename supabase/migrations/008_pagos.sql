-- ============================================================
-- Migración 008: pagos
-- Registra anticipos y pagos finales de cada cita. Solo la
-- administradora tiene acceso (gestión financiera del negocio);
-- el cliente no consulta sus pagos directamente desde esta tabla.
-- ============================================================

CREATE TABLE pagos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id     UUID          NOT NULL REFERENCES citas(id),
  monto       DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  tipo_pago   VARCHAR(20)   NOT NULL CHECK (tipo_pago IN ('anticipo', 'pago_final')),
  metodo_pago VARCHAR(30)   NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia', 'pago_en_linea')),
  estado      VARCHAR(20)   NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
  fecha_pago  TIMESTAMP     DEFAULT now()
);

CREATE INDEX idx_pagos_cita   ON pagos(cita_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Solo la administradora tiene acceso a los pagos. El registro de
-- pagos en línea desde el cliente se hace vía server action con
-- service role (Fase 24), no con el cliente autenticado directo.
CREATE POLICY "pagos_admin_all" ON pagos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE pagos IS 'Pagos (anticipo y pago final) asociados a cada cita. Acceso restringido a administración.';
