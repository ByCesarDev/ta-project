-- ==============================================================================
-- TOTALANIME 2.0 - ESTRATEGIA DETERMINISTA DE GRANTS Y PRIVILEGIOS POR COLUMNA
-- Archivo: supabase/grants.sql
-- Versión: 2.4.1 Production-Ready
-- Descripción: Revocación total de permisos inseguros por defecto y asignación
--              mínima de privilegios a nivel de tabla y columna (Column-Level Security).
-- ==============================================================================

-- ========================================================
-- 1. REVOCACIÓN TOTAL INICIAL (Defensa en Profundidad)
-- ========================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;

-- ========================================================
-- 2. CONCESIONES PARA ROL 'anon' (Visitantes no autenticados)
-- ========================================================

-- 2.1 Lectura de Catálogo Público y Configuración
GRANT SELECT ON TABLE 
    public.animes, 
    public.episodes, 
    public.episode_sources, 
    public.genres, 
    public.anime_genres, 
    public.avatars, 
    public.app_settings, 
    public.anime_views, 
    public.profiles 
TO anon;

-- Nota de Seguridad: record_anime_view NO se concede a anon ni a authenticated
-- para evitar manipulación o spam de métricas desde DevTools.
-- Las vistas se procesan exclusivamente vía API/Worker en Render con Secret Key / Service Role.

-- ========================================================
-- 3. CONCESIONES PARA ROL 'authenticated' (Usuarios y Moderadores/Admins)
-- ========================================================

-- 3.1 Permisos Generales de Lectura y Uso de Secuencias
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3.2 Interacción Personal de Usuarios (CRUD en datos propios protegido por RLS)
-- Nota: Las tablas de staging (unresolved_*) son solo lectura para clientes y administradas por service_role
GRANT INSERT, UPDATE, DELETE ON TABLE 
    public.user_history, 
    public.user_episode_status, 
    public.watch_later
TO authenticated;

-- 3.3 Privilegios por Columna en 'profiles' (Evita modificación de ID o timestamps)
GRANT UPDATE (username, avatar_url, bio) ON TABLE public.profiles TO authenticated;

-- 3.4 Gestión Administrativa de Roles y Settings (Restringido por RLS a Admin)
GRANT INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.app_settings TO authenticated;

-- 3.5 Privilegios por Columna en 'animes' (BLOQUEO DE BYPASS EN INSERT Y UPDATE)
-- Nota: claimed_by y claimed_at solo pueden asignarse a través de public.claim_anime()
--       views_count solo puede incrementarse por el backend / workers autorizados
GRANT INSERT (
    name, 
    title_romaji, 
    title_english, 
    title_native, 
    cover_image, 
    banner_image, 
    status, 
    episodes, 
    description, 
    anilist_id, 
    season_year, 
    format, 
    slug, 
    air_day, 
    air_time, 
    air_timezone, 
    start_date, 
    end_date
) ON TABLE public.animes TO authenticated;

GRANT UPDATE (
    name, 
    title_romaji, 
    title_english, 
    title_native, 
    cover_image, 
    banner_image, 
    status, 
    episodes, 
    description, 
    anilist_id, 
    season_year, 
    format, 
    slug, 
    air_day, 
    air_time, 
    air_timezone, 
    start_date, 
    end_date
) ON TABLE public.animes TO authenticated;

GRANT DELETE ON TABLE public.animes TO authenticated;

-- 3.6 Gestión de Catálogo y Recursos (Mod/Admin regulado por RLS)
GRANT INSERT, UPDATE, DELETE ON TABLE 
    public.episodes, 
    public.genres, 
    public.anime_genres, 
    public.avatars, 
    public.admin_notifications 
TO authenticated;

-- Hardening: episode_sources mutaciones están reservadas exclusivamente para service_role (API backend)
REVOKE INSERT, UPDATE, DELETE ON TABLE public.episode_sources FROM authenticated, anon, PUBLIC;
GRANT SELECT ON TABLE public.episode_sources TO anon, authenticated;

-- 3.7 Ejecución de Funciones de Seguridad y RPCs
GRANT EXECUTE ON FUNCTION public.is_active_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_anime(INT) TO authenticated;

-- ========================================================
-- 4. CONCESIONES EXPLÍCITAS PARA ROL 'service_role' (Backend / Render Worker)
-- ========================================================
-- 4.1 Privilegios actuales
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.record_anime_view(INT) TO service_role;

-- 4.2 Privilegios por defecto para futuras entidades creadas en schema public
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

