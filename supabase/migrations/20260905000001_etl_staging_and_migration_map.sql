-- ==============================================================================
-- TOTALANIME 2.0 - MIGRATION 20260905000001
-- Nombre: etl_staging_and_migration_map
-- Descripción: Tablas de staging para historial no resuelto, watchlist no resuelto
--              y formalización del mapa de migración de usuarios INT -> UUID.
-- ==============================================================================

-- 1. MAPA FORMAL DE MIGRACIÓN DE USUARIOS (INT -> UUID)
CREATE TABLE IF NOT EXISTS public.migration_user_map (
    legacy_id INT PRIMARY KEY,
    supabase_uuid UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    migrated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. STAGING DE HISTORIAL LEGACY NO RESUELTO
-- Preserva historial de animes/episodios que no están en el catálogo inicial de 17 animes
CREATE TABLE IF NOT EXISTS public.unresolved_legacy_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    legacy_anime_id VARCHAR(255) NOT NULL,
    anime_title VARCHAR(255) NOT NULL,
    anime_ep VARCHAR(50) NOT NULL,
    anime_image TEXT NOT NULL,
    anime_release VARCHAR(50),
    dub_or_sub VARCHAR(10) DEFAULT 'sub',
    anime_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unresolved_history_user_id ON public.unresolved_legacy_history(user_id);

-- 3. STAGING DE WATCHLIST LEGACY NO RESUELTO
-- Preserva favoritos cuyo anime no está aún en el catálogo oficial (e.g. Bunny Girl, Re:ZERO, Naruto)
CREATE TABLE IF NOT EXISTS public.unresolved_watch_later (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legacy_slug VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    type VARCHAR(50),
    released VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unresolved_watch_later_user_id ON public.unresolved_watch_later(user_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.migration_user_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unresolved_legacy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unresolved_watch_later ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MigrationUserMap: Admin Read Only" ON public.migration_user_map;
CREATE POLICY "MigrationUserMap: Admin Read Only" ON public.migration_user_map
    FOR SELECT
    USING ((select public.is_admin()));

DROP POLICY IF EXISTS "UnresolvedHistory: Manage Own" ON public.unresolved_legacy_history;
CREATE POLICY "UnresolvedHistory: Manage Own" ON public.unresolved_legacy_history 
    FOR ALL 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()))
    WITH CHECK ((select auth.uid()) = user_id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "UnresolvedWatchLater: Manage Own" ON public.unresolved_watch_later;
CREATE POLICY "UnresolvedWatchLater: Manage Own" ON public.unresolved_watch_later 
    FOR ALL 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()))
    WITH CHECK ((select auth.uid()) = user_id AND (select public.is_active_user()));

-- 5. PERMISOS Y ROLES (GRANTs)
GRANT SELECT ON public.migration_user_map TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE 
    public.unresolved_legacy_history,
    public.unresolved_watch_later
TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE 
    public.unresolved_legacy_history_id_seq,
    public.unresolved_watch_later_id_seq
TO authenticated;

GRANT ALL ON TABLE
    public.migration_user_map,
    public.unresolved_legacy_history,
    public.unresolved_watch_later
TO service_role;

GRANT ALL ON SEQUENCE
    public.unresolved_legacy_history_id_seq,
    public.unresolved_watch_later_id_seq
TO service_role;
