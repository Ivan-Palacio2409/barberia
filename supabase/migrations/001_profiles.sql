-- ============================================================
-- Migración 001: profiles
-- [C1] Reemplaza la antigua tabla `usuarios`. Vinculada 1:1 con
-- auth.users mediante `id`. Se crea automáticamente con un
-- trigger en cada registro nuevo (ver función handle_new_user).
-- ============================================================

-- Función reutilizable para mantener `updated_at` actualizado.
-- Se usa en profiles y en el resto de tablas del proyecto.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE profiles (
  id          UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      VARCHAR(100) NOT NULL,
  telefono    VARCHAR(20),
  rol         VARCHAR(20)  NOT NULL DEFAULT 'cliente'
                           CHECK (rol IN ('administrador', 'cliente')),
  foto_perfil TEXT,
  created_at  TIMESTAMP    DEFAULT now(),
  updated_at  TIMESTAMP    DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Trigger: crear profile automáticamente al registrarse ────
-- Lee nombre/teléfono de los metadatos enviados desde el
-- formulario de registro (raw_user_meta_data).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, telefono, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'telefono',
    'cliente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario lee y edita únicamente su propio perfil.
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- La administradora puede leer todos los perfiles.
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'administrador'
    )
  );

COMMENT ON TABLE profiles IS 'Perfiles de usuarios autenticados. Reemplaza la tabla usuarios (eliminada). [C1]';
