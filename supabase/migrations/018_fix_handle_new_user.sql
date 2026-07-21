-- ============================================================
-- 018_fix_handle_new_user.sql — Fase 7 [C1 + C2]
-- Actualiza el trigger handle_new_user para que además de crear
-- el profile, llame a conciliar_cliente_con_auth() y así enlace
-- o cree automáticamente el registro en clientes.
-- Este script debe ejecutarse DESPUÉS de 002_clientes.sql
-- porque depende de conciliar_cliente_con_auth().
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_rol VARCHAR := COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente');
BEGIN
  -- [C1] Crear profile vinculado a auth.users
  INSERT INTO public.profiles (id, nombre, telefono, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'telefono',
    v_rol
  )
  ON CONFLICT (id) DO NOTHING;

  -- [C2] Solo para clientes (no administradores): conciliar o crear cliente
  IF v_rol <> 'administrador' THEN
    PERFORM conciliar_cliente_con_auth(
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'telefono'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
