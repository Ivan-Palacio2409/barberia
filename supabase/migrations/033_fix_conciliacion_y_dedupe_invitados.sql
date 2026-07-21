-- ============================================================
-- Migración 033: corregir conciliar_cliente_con_auth() y
-- eliminar duplicados de clientes invitados.
-- QA (post fase 30) — hallazgos adicionales.
-- ============================================================

-- ── Bug 1: nombre = email en clientes nuevos ────────────────
-- Evidencia (migración 002, función conciliar_cliente_con_auth):
--   INSERT INTO clientes (auth_user_id, nombre, email, telefono)
--   VALUES (p_auth_user_id, p_email, p_email, COALESCE(p_telefono, ''))
-- Las columnas son (auth_user_id, nombre, email, telefono) pero el
-- segundo valor (que cae en "nombre") es p_email, no un nombre.
-- Además la función nunca recibía el nombre como parámetro.
-- Resultado reproducible: cualquier cliente que se registra
-- directamente (sin haber reservado antes como invitado) queda
-- guardado en `clientes.nombre` con su correo electrónico en vez
-- de su nombre real — visible en todo el panel de administración
-- (lista de clientes, citas, reportes).
CREATE OR REPLACE FUNCTION conciliar_cliente_con_auth(
  p_auth_user_id UUID,
  p_email        VARCHAR,
  p_telefono     VARCHAR,
  p_nombre       VARCHAR DEFAULT NULL
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
    VALUES (p_auth_user_id, COALESCE(p_nombre, p_email), p_email, COALESCE(p_telefono, ''))
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualiza el trigger para que sí pase el nombre capturado en el
-- registro (ya estaba disponible en NEW.raw_user_meta_data, solo
-- no se lo pasábamos a la función).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_rol    VARCHAR := COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente');
  v_nombre VARCHAR := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
BEGIN
  INSERT INTO public.profiles (id, nombre, telefono, rol)
  VALUES (NEW.id, v_nombre, NEW.raw_user_meta_data->>'telefono', v_rol)
  ON CONFLICT (id) DO NOTHING;

  IF v_rol <> 'administrador' THEN
    PERFORM conciliar_cliente_con_auth(
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'telefono',
      v_nombre
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: esta corrección solo aplica hacia adelante. Los clientes ya
-- guardados con nombre = email (registrados antes de esta
-- migración) no se tocan automáticamente porque no hay forma
-- confiable de recuperar su nombre real desde acá; conviene que la
-- administradora revise el listado de clientes filtrando por
-- "nombre parece un correo" y los corrija a mano si encuentra
-- alguno.

-- ── Bug 2: clientes invitados duplicados ────────────────────
-- Evidencia: ReservaStep4DatosCliente.tsx llama a
-- crearClienteInvitado() sin revisar antes si ya existe un
-- invitado con ese teléfono/email (ej. el usuario hace doble clic,
-- pierde conexión y reintenta, o abre el formulario de nuevo).
-- Cada intento crea una fila nueva en `clientes`. Además, por RLS,
-- un invitado (auth_user_id IS NULL, sesión anónima) no puede ni
-- siquiera hacer SELECT sobre clientes existentes para revisar
-- duplicados por su cuenta — se necesita una función
-- SECURITY DEFINER que sí pueda mirar toda la tabla.
-- Devuelve la fila completa (no solo el id) a propósito: un
-- invitado sin sesión no tiene permiso RLS para hacer SELECT sobre
-- `clientes` después, así que el cliente no puede simplemente
-- pedir la fila recién creada/encontrada en una segunda llamada.
CREATE OR REPLACE FUNCTION buscar_o_crear_cliente_invitado(
  p_nombre   VARCHAR,
  p_telefono VARCHAR,
  p_email    VARCHAR DEFAULT NULL
) RETURNS SETOF clientes AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM clientes
  WHERE auth_user_id IS NULL
    AND (
      telefono = p_telefono
      OR (p_email IS NOT NULL AND email = p_email)
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Actualiza nombre/email por si cambiaron desde la última vez
    -- (ej. el invitado corrigió un typo en su nombre).
    UPDATE clientes
    SET nombre = p_nombre,
        email  = COALESCE(p_email, email),
        updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO clientes (auth_user_id, nombre, telefono, email)
    VALUES (NULL, p_nombre, p_telefono, p_email)
    RETURNING id INTO v_id;
  END IF;

  RETURN QUERY SELECT * FROM clientes WHERE id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION buscar_o_crear_cliente_invitado(VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated;

COMMENT ON FUNCTION buscar_o_crear_cliente_invitado IS
  'QA fase 30: reemplaza el INSERT directo de crearClienteInvitado() para no crear un registro de clientes duplicado cada vez que un invitado reintenta el paso 4 de la reserva.';
