-- ==============================================================================
-- TOTALANIME 2.0 - EXTENSIÓN DE PERFILES: DISPLAY NAME, USERNAME & BIO
-- Migración: 20261104000008_viewer_profiles_identity_and_bio.sql
-- ==============================================================================

-- 1. Agregar columnas display_name, username y bio si no existen
ALTER TABLE public.viewer_profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(40);
ALTER TABLE public.viewer_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(30);
ALTER TABLE public.viewer_profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- 2. Backfill de display_name usando name
UPDATE public.viewer_profiles 
SET display_name = name 
WHERE display_name IS NULL OR display_name = '';

-- 3. Backfill robusto y determinista de @username garantizando unicidad y longitud mínima
DO $$
DECLARE
  rec RECORD;
  clean_base TEXT;
  candidate TEXT;
  counter INT;
BEGIN
  -- Fase A: Perfiles con username vacío o nulo
  FOR rec IN 
    SELECT id, name, created_at 
    FROM public.viewer_profiles 
    WHERE username IS NULL OR username = ''
    ORDER BY created_at ASC, id ASC
  LOOP
    -- Sanitizar eliminando caracteres inválidos
    clean_base := LOWER(REGEXP_REPLACE(COALESCE(rec.name, 'user'), '[^a-zA-Z0-9_]', '', 'g'));
    
    -- Si el nombre quedó vacío o menor a 3 caracteres (ej. emojis, caracteres especiales), generar prefijo seguro
    IF LENGTH(clean_base) < 3 THEN
      clean_base := 'user_' || SUBSTRING(REPLACE(rec.id::text, '-', ''), 1, 6);
    END IF;

    -- Limitar longitud base para permitir sufijo numérico si ocurre colisión
    IF LENGTH(clean_base) > 18 THEN
      clean_base := SUBSTRING(clean_base, 1, 18);
    END IF;

    candidate := clean_base;
    counter := 1;

    -- Resolver colisiones contra cualquier otro perfil
    WHILE EXISTS (
      SELECT 1 FROM public.viewer_profiles 
      WHERE LOWER(username) = LOWER(candidate) AND id <> rec.id
    ) LOOP
      candidate := clean_base || '_' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE public.viewer_profiles
    SET username = candidate
    WHERE id = rec.id;
  END LOOP;

  -- Fase B: Resolver posibles colisiones preexistentes entre usernames ya asignados
  FOR rec IN 
    SELECT v1.id, v1.username, v1.name
    FROM public.viewer_profiles v1
    WHERE EXISTS (
      SELECT 1 FROM public.viewer_profiles v2 
      WHERE LOWER(v2.username) = LOWER(v1.username) 
        AND v2.id <> v1.id 
        AND (v2.created_at < v1.created_at OR (v2.created_at = v1.created_at AND v2.id < v1.id))
    )
    ORDER BY v1.created_at ASC, v1.id ASC
  LOOP
    clean_base := LOWER(REGEXP_REPLACE(COALESCE(rec.username, rec.name, 'user'), '[^a-zA-Z0-9_]', '', 'g'));
    IF LENGTH(clean_base) < 3 THEN
      clean_base := 'user_' || SUBSTRING(REPLACE(rec.id::text, '-', ''), 1, 6);
    END IF;
    IF LENGTH(clean_base) > 18 THEN
      clean_base := SUBSTRING(clean_base, 1, 18);
    END IF;

    candidate := clean_base;
    counter := 1;

    WHILE EXISTS (
      SELECT 1 FROM public.viewer_profiles 
      WHERE LOWER(username) = LOWER(candidate) AND id <> rec.id
    ) LOOP
      candidate := clean_base || '_' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE public.viewer_profiles
    SET username = candidate
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 4. Índice único para búsqueda e integridad de @username
CREATE UNIQUE INDEX IF NOT EXISTS idx_viewer_profiles_username_unique 
ON public.viewer_profiles(LOWER(username));

-- 5. Recargar PostgREST para exponer las nuevas columnas en la API inmediatamente
NOTIFY pgrst, 'reload schema';
