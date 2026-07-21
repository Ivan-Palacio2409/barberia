-- ============================================================
-- Migración 034: políticas de storage.objects para el bucket
-- privado `estilos-referencia` + validación de url_imagen.
-- QA (post fase 30) — hallazgos M1 y L1.
--
-- ── M1 — sin esto, crearCitaCompleta() no puede subir fotos ──
-- Evidencia: src/lib/supabase/server.ts usa la ANON KEY (no
-- service role), así que la subida de imágenes en el paso 4 del
-- flujo de reserva (src/app/actions/citas.ts, sección 4) está
-- sujeta a RLS de storage.objects igual que cualquier INSERT de
-- base de datos. No existía ninguna política para el bucket
-- `estilos-referencia` en el repo, así que — sin este script — la
-- subida de fotos falla en silencio (el error se atrapa con
-- try/catch y solo se loguea, ver citas.ts línea ~180).
--
-- El path que arma citas.ts es `${authUserId ?? clienteId}/...`
-- (ver `pathBase` en crearCitaCompleta). Esta política reconoce
-- ese mismo esquema: el primer segmento del path debe ser el
-- auth.uid() de quien sube (cliente con sesión) o el id de un
-- cliente invitado (auth_user_id IS NULL) existente en `clientes`.
--
-- Nota sobre invitados: como un invitado no tiene JWT propio, no
-- hay forma de que Postgres verifique "esta persona es dueña de
-- este cliente_id" — es la misma limitación que ya aceptamos en la
-- migración 030 para INSERT en `clientes`/`citas`. Esta política
-- no la introduce, solo la mantiene consistente para storage.
--
-- Solo la administradora puede LEER (SELECT) o BORRAR (DELETE)
-- archivos de este bucket — coincide con que GaleriaReferencia.tsx
-- y GaleriaEstilos.tsx son ambos componentes de /admin.
-- ============================================================

-- ── INSERT: cliente con sesión (su propia carpeta) ───────────
DROP POLICY IF EXISTS "cliente_insert_estilos_storage" ON storage.objects;
CREATE POLICY "cliente_insert_estilos_storage" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'estilos-referencia'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── INSERT: invitado (carpeta = id de un cliente invitado real) ──
DROP POLICY IF EXISTS "invitado_insert_estilos_storage" ON storage.objects;
CREATE POLICY "invitado_insert_estilos_storage" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'estilos-referencia'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM clientes WHERE auth_user_id IS NULL
    )
  );

-- ── SELECT: solo administradora ──────────────────────────────
DROP POLICY IF EXISTS "admin_select_estilos_storage" ON storage.objects;
CREATE POLICY "admin_select_estilos_storage" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'estilos-referencia'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador'
    )
  );

-- ── DELETE: solo administradora ──────────────────────────────
DROP POLICY IF EXISTS "admin_delete_estilos_storage" ON storage.objects;
CREATE POLICY "admin_delete_estilos_storage" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'estilos-referencia'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador'
    )
  );

-- Nota: no se agrega COMMENT ON POLICY para storage.objects porque
-- el rol del SQL Editor de Supabase no es dueño de esa tabla
-- (pertenece internamente a Supabase) y COMMENT sí exige ownership
-- estricto, a diferencia de CREATE POLICY. Si corrés esto y te da
-- "must be owner of relation objects" en algún COMMENT, es
-- justamente por esto — las políticas de arriba ya quedaron creadas
-- igual, el COMMENT es solo documentación y no es necesario.

-- ============================================================
-- L1 — validar que url_imagen sea un path de storage, no una URL
-- completa ni un path con traversal ('../').
--
-- Evidencia: estilos_referencia.url_imagen se guarda tal como lo
-- arma el frontend/servidor (`${pathBase}/${stamp}-${rand}.${ext}`,
-- ver citas.ts). No había ninguna restricción en la base de datos
-- que impidiera guardar ahí una URL externa completa o un path con
-- '..'; como este valor se usa después para pedir un signed URL
-- (getSignedUrl / createSignedUrl) contra el bucket, un valor mal
-- formado ahí podría, en el mejor caso, romper la vista de
-- galería, y en el peor, ser un vector para intentar acceder fuera
-- de la carpeta esperada.
--
-- NOT VALID + VALIDATE por separado: así la migración no falla si
-- ya existen filas (no debería haberlas, pero es más seguro) — se
-- puede revisar antes de forzar la validación completa.
-- ============================================================

ALTER TABLE estilos_referencia DROP CONSTRAINT IF EXISTS estilos_referencia_url_valida;

ALTER TABLE estilos_referencia
  ADD CONSTRAINT estilos_referencia_url_valida
  CHECK (
    url_imagen ~ '^[a-zA-Z0-9-]+/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$'
  ) NOT VALID;

-- Si esto falla, correr antes:
--   SELECT id, url_imagen FROM estilos_referencia
--   WHERE url_imagen !~ '^[a-zA-Z0-9-]+/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$';
-- y corregir/borrar esas filas a mano.
ALTER TABLE estilos_referencia VALIDATE CONSTRAINT estilos_referencia_url_valida;

COMMENT ON CONSTRAINT estilos_referencia_url_valida ON estilos_referencia IS
  'Auditoría calidad fase 30 (L1): impide guardar una URL completa o un path con traversal en url_imagen; solo acepta "carpeta/archivo.ext".';
