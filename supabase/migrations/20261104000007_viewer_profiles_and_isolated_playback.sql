-- ==============================================================================
-- TOTALANIME 2.0 - VIEWER PROFILES & PLAYBACK ISOLATION MIGRATION
-- Migration: 20261104000007_viewer_profiles_and_isolated_playback.sql
-- ==============================================================================

-- 1. TABLA DE PERFILES DE ESPECTADOR (public.viewer_profiles)
CREATE TABLE IF NOT EXISTS public.viewer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(40) NOT NULL,
    avatar_url TEXT,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_viewer_profiles_account_id ON public.viewer_profiles(account_id);

-- Restricción: solo un perfil default por cuenta
CREATE UNIQUE INDEX IF NOT EXISTS idx_viewer_profiles_single_default 
ON public.viewer_profiles(account_id) WHERE is_default = TRUE;

-- Trigger para updated_at automático
DROP TRIGGER IF EXISTS update_viewer_profiles_updated_at ON public.viewer_profiles;
CREATE TRIGGER update_viewer_profiles_updated_at 
BEFORE UPDATE ON public.viewer_profiles 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función y trigger para límite de máximo 5 perfiles por cuenta
CREATE OR REPLACE FUNCTION public.check_viewer_profile_limit()
RETURNS TRIGGER AS $$
DECLARE
    profile_count INT;
BEGIN
    SELECT COUNT(*) INTO profile_count 
    FROM public.viewer_profiles 
    WHERE account_id = NEW.account_id;

    IF profile_count >= 5 THEN
        RAISE EXCEPTION 'Límite máximo alcanzado: cada cuenta puede tener como máximo 5 perfiles.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_viewer_profile_limit ON public.viewer_profiles;
CREATE TRIGGER enforce_viewer_profile_limit
BEFORE INSERT ON public.viewer_profiles
FOR EACH ROW EXECUTE FUNCTION public.check_viewer_profile_limit();

-- 2. POLÍTICAS DE SEGURIDAD (RLS) PARA public.viewer_profiles
ALTER TABLE public.viewer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can read own viewer profiles"
ON public.viewer_profiles FOR SELECT
USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can create own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can create own viewer profiles"
ON public.viewer_profiles FOR INSERT
WITH CHECK (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can update own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can update own viewer profiles"
ON public.viewer_profiles FOR UPDATE
USING (auth.uid() = account_id)
WITH CHECK (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can delete own non-default viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can delete own non-default viewer profiles"
ON public.viewer_profiles FOR DELETE
USING (auth.uid() = account_id AND is_default = FALSE);

-- Service Role tiene bypass completo
DROP POLICY IF EXISTS "Service role full access on viewer_profiles" ON public.viewer_profiles;
CREATE POLICY "Service role full access on viewer_profiles"
ON public.viewer_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. MIGRACIÓN INICIAL: CREAR PERFIL POR DEFECTO PARA CADA USUARIO EXISTENTE
-- Usa el ID del usuario como ID de su perfil predeterminado para mapeo 1:1 automático
INSERT INTO public.viewer_profiles (id, account_id, name, avatar_url, is_default, created_at, updated_at)
SELECT 
    p.id, 
    p.id, 
    COALESCE(NULLIF(TRIM(p.username), ''), 'Principal'), 
    p.avatar_url, 
    TRUE, 
    COALESCE(p.created_at, NOW()), 
    NOW()
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- 4. ADAPTACIÓN DE HISTORIAL DE REPRODUCCIÓN (public.user_history)
ALTER TABLE public.user_history
ADD COLUMN IF NOT EXISTS viewer_profile_id UUID REFERENCES public.viewer_profiles(id) ON DELETE CASCADE;

-- Backfill histórico: el perfil predeterminado coincide con el user_id
UPDATE public.user_history
SET viewer_profile_id = user_id
WHERE viewer_profile_id IS NULL;

-- Actualizar clave única a nivel de perfil
ALTER TABLE public.user_history DROP CONSTRAINT IF EXISTS user_history_user_id_episode_id_key;
ALTER TABLE public.user_history DROP CONSTRAINT IF EXISTS user_history_viewer_profile_id_episode_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_history_profile_episode 
ON public.user_history(viewer_profile_id, episode_id);

-- 5. ADAPTACIÓN DE FAVORITOS DE SERIES (public.user_favorites)
ALTER TABLE public.user_favorites
ADD COLUMN IF NOT EXISTS viewer_profile_id UUID REFERENCES public.viewer_profiles(id) ON DELETE CASCADE;

UPDATE public.user_favorites
SET viewer_profile_id = user_id
WHERE viewer_profile_id IS NULL;

ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_user_id_series_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_profile_series 
ON public.user_favorites(viewer_profile_id, series_id);

-- 6. ADAPTACIÓN DE SEGUIMIENTO (public.watch_later)
ALTER TABLE public.watch_later
ADD COLUMN IF NOT EXISTS viewer_profile_id UUID REFERENCES public.viewer_profiles(id) ON DELETE CASCADE;

UPDATE public.watch_later
SET viewer_profile_id = user_id
WHERE viewer_profile_id IS NULL;

ALTER TABLE public.watch_later DROP CONSTRAINT IF EXISTS watch_later_user_id_anime_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_later_profile_anime 
ON public.watch_later(viewer_profile_id, anime_id);

-- 7. ADAPTACIÓN DE ESTADO DE EPISODIOS VISTOS (public.user_episode_status)
ALTER TABLE public.user_episode_status
ADD COLUMN IF NOT EXISTS viewer_profile_id UUID REFERENCES public.viewer_profiles(id) ON DELETE CASCADE;

UPDATE public.user_episode_status
SET viewer_profile_id = user_id
WHERE viewer_profile_id IS NULL;

ALTER TABLE public.user_episode_status DROP CONSTRAINT IF EXISTS user_episode_status_user_id_episode_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_episode_status_profile_episode 
ON public.user_episode_status(viewer_profile_id, episode_id);

-- 8. CONCESIONES DE PERMISOS (GRANTS) Y RECARGA DE ESQUEMA POSTGREST
GRANT ALL ON TABLE public.viewer_profiles TO authenticated, service_role;
GRANT SELECT ON TABLE public.viewer_profiles TO anon;
GRANT ALL ON TABLE public.user_favorites TO authenticated;
GRANT ALL ON TABLE public.watch_later TO authenticated;
GRANT ALL ON TABLE public.user_history TO authenticated;
GRANT ALL ON TABLE public.user_episode_status TO authenticated;

-- Notificar a PostgREST para recargar el schema cache inmediatamente
NOTIFY pgrst, 'reload schema';

