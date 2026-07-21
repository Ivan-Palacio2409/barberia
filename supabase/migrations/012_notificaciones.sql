-- ============================================================
-- Migración 012: notificaciones
-- [C3] Arquitectura multi-canal desde el inicio: el campo `canal`
-- existe desde esta migración (no se añade después), de modo que
-- agregar WhatsApp en la Fase 23 no requiere cambios estructurales,
-- solo un nuevo NotificationProvider que lea este mismo campo.
-- ============================================================

CREATE TABLE notificaciones (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID         NOT NULL REFERENCES clientes(id),
  cita_id           UUID         REFERENCES citas(id),
  tipo              VARCHAR(50)  NOT NULL CHECK (tipo IN (
                      'confirmacion_cita', 'recordatorio_24_horas', 'recordatorio_mismo_dia',
                      'confirmacion_pago', 'reagendamiento_cita', 'cancelacion_cita',
                      'solicitud_resena', 'aviso_lista_espera')),
  canal             VARCHAR(20)  NOT NULL DEFAULT 'email' CHECK (canal IN ('email', 'whatsapp', 'ambos')),
  enviado           BOOLEAN      NOT NULL DEFAULT false,
  fecha_programada  TIMESTAMP    NOT NULL
);

CREATE INDEX idx_notificaciones_enviado    ON notificaciones(enviado);
CREATE INDEX idx_notificaciones_programada ON notificaciones(fecha_programada);
CREATE INDEX idx_notificaciones_cliente    ON notificaciones(cliente_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Solo la administradora y el service role (tareas programadas
-- en background, Edge Functions) tienen acceso a esta tabla. El
-- cliente nunca consulta sus notificaciones directamente desde
-- el cliente de Supabase; las recibe por el canal correspondiente.
CREATE POLICY "notificaciones_admin_all" ON notificaciones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE notificaciones IS 'Notificaciones programadas multi-canal. Campo canal desde el inicio. [C3]';
