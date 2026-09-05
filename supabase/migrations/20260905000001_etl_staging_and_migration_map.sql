-- ==============================================================================
-- TOTALANIME 2.0 - MIGRATION 20260905000001
-- Nombre: etl_staging_and_migration_map
-- Descripción: Tablas de staging protegidas para historial y watchlist no resueltos
--              con trazabilidad legacy_id e inmutabilidad cliente (solo backend escribe),
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
-- Preserva historial de animes/episodios fuera de catálogo con trazabilidad e idempotencia
CREATE TABLE IF NOT EXISTS public.unresolved_legacy_history (
    id BIGSERIAL PRIMARY KEY,
    legacy_id INT UNIQUE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_unresolved_history_legacy_id ON public.unresolved_legacy_history(legacy_id);

-- 3. STAGING DE WATCHLIST LEGACY NO RESUELTO
-- Preserva favoritos cuyo anime no está aún en catálogo con trazabilidad e idempotencia
CREATE TABLE IF NOT EXISTS public.unresolved_watch_later (
    id BIGSERIAL PRIMARY KEY,
    legacy_id INT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legacy_slug VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    type VARCHAR(50),
    released VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unresolved_watch_later_user_id ON public.unresolved_watch_later(user_id);
CREATE INDEX IF NOT EXISTS idx_unresolved_watch_later_legacy_id ON public.unresolved_watch_later(legacy_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.migration_user_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unresolved_legacy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unresolved_watch_later ENABLE ROW LEVEL SECURITY;

-- 4.1 migration_user_map: Solo lectura para administradores
DROP POLICY IF EXISTS "MigrationUserMap: Admin Read Only" ON public.migration_user_map;
CREATE POLICY "MigrationUserMap: Admin Read Only" ON public.migration_user_map
    FOR SELECT
    USING ((select public.is_admin()));

-- 4.2 Tablas de Staging: Solo lectura (SELECT) para el dueño de los datos (inmutabilidad desde cliente)
DROP POLICY IF EXISTS "UnresolvedHistory: Read Own" ON public.unresolved_legacy_history;
DROP POLICY IF EXISTS "UnresolvedHistory: Manage Own" ON public.unresolved_legacy_history;
CREATE POLICY "UnresolvedHistory: Read Own" ON public.unresolved_legacy_history 
    FOR SELECT 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "UnresolvedWatchLater: Read Own" ON public.unresolved_watch_later;
DROP POLICY IF EXISTS "UnresolvedWatchLater: Manage Own" ON public.unresolved_watch_later;
CREATE POLICY "UnresolvedWatchLater: Read Own" ON public.unresolved_watch_later 
    FOR SELECT 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()));

-- 4.3 Administrador puede auditar staging
DROP POLICY IF EXISTS "UnresolvedHistory: Admin Read Only" ON public.unresolved_legacy_history;
CREATE POLICY "UnresolvedHistory: Admin Read Only" ON public.unresolved_legacy_history
    FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "UnresolvedWatchLater: Admin Read Only" ON public.unresolved_watch_later;
CREATE POLICY "UnresolvedWatchLater: Admin Read Only" ON public.unresolved_watch_later
    FOR SELECT USING ((select public.is_admin()));

-- 5. PERMISOS Y ROLES (GRANTs)
-- Los usuarios regulares SOLO pueden leer sus datos no resueltos, NUNCA insertar/modificar/borrar en staging
GRANT SELECT ON public.migration_user_map TO authenticated;
GRANT SELECT ON public.unresolved_legacy_history TO authenticated;
GRANT SELECT ON public.unresolved_watch_later TO authenticated;

-- Service Role (Backend / Workers en Render) posee control total
GRANT ALL ON TABLE
    public.migration_user_map,
    public.unresolved_legacy_history,
    public.unresolved_watch_later
TO service_role;

GRANT ALL ON SEQUENCE
    public.unresolved_legacy_history_id_seq,
    public.unresolved_watch_later_id_seq
TO service_role;
