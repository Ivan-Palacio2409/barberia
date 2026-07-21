-- ============================================================
-- Migración 041: bloques de mañana/tarde en horarios_trabajo
--
-- Permite que un mismo día tenga hasta dos rangos de atención
-- independientes (jornada partida), ej. 08:00-13:00 y
-- 14:00-18:00, en vez de un único rango continuo por día.
-- ============================================================

ALTER TABLE horarios_trabajo
  ADD COLUMN bloque TEXT NOT NULL DEFAULT 'manana' CHECK (bloque IN ('manana', 'tarde'));

-- Cada día solo puede tener un bloque de mañana y uno de tarde.
ALTER TABLE horarios_trabajo
  ADD CONSTRAINT horarios_trabajo_dia_bloque_unique UNIQUE (dia_semana, bloque);

-- A cada día que ya tenía horario configurado se le agrega su
-- bloque de tarde (inactivo por defecto), para que la administradora
-- pueda activarlo y definir el rango si trabaja en jornada partida.
INSERT INTO horarios_trabajo (dia_semana, hora_inicio, hora_fin, activo, bloque)
SELECT dia_semana, '14:00', '18:00', false, 'tarde'
FROM horarios_trabajo
WHERE bloque = 'manana';

COMMENT ON COLUMN horarios_trabajo.bloque IS
  'Bloque de la jornada: manana o tarde. Permite configurar jornada partida (ej. 08:00-13:00 y 14:00-18:00) por día.';
