-- ============================================================
-- Migración 024: imagen_url en servicios
-- Fase 20 — Gestión de Servicios y Catálogo de Diseños (Admin)
-- Agrega soporte de imagen al catálogo de servicios.
-- ============================================================

ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

COMMENT ON COLUMN servicios.imagen_url IS
  'URL pública de la imagen representativa del servicio (opcional).';
