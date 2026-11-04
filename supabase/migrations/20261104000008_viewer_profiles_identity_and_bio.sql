-- ==============================================================================
-- TOTALANIME 2.0 - EXTENSIÓN DE PERFILES: DISPLAY NAME, USERNAME & BIO
-- Migración: 20261104000008_viewer_profiles_identity_and_bio.sql
-- ==============================================================================

-- 1. Agregar columnas display_name, username y bio si no existen
ALTER TABLE public.viewer_profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(40);
ALTER TABLE public.viewer_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(30);
ALTER TABLE public.viewer_profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- 2. Backfill inicial para perfiles ya creados
UPDATE public.viewer_profiles 
SET display_name = name 
WHERE display_name IS NULL OR display_name = '';

UPDATE public.viewer_profiles 
SET username = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9_]', '', 'g')) 
WHERE username IS NULL OR username = '';

-- 3. Índice único para búsqueda e integridad de @username
CREATE UNIQUE INDEX IF NOT EXISTS idx_viewer_profiles_username_unique 
ON public.viewer_profiles(LOWER(username));

-- 4. Recargar PostgREST para exponer las nuevas columnas en la API inmediatamente
NOTIFY pgrst, 'reload schema';

