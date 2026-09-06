-- ==============================================================================
-- TOTALANIME 2.0 - MASTER COMPLETE INSTALLATION SCRIPT (CLEAN SLATE TO FASE 4)
-- Archivo: supabase/master-install.sql
-- ==============================================================================

-- 1. LIMPIEZA TOTAL DEL ESQUEMA PUBLICO Y USUARIOS
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Limpieza completa de usuarios de autenticación anteriores
DELETE FROM auth.users;


-- ============================================================================
-- FILE: 20260905000000_initial_totalanime.sql
-- ============================================================================
-- ==============================================================================
-- TOTALANIME 2.0 - MIGRACIÓN INICIAL COMPLETA (SCHEMA + RLS + GRANTS + STORAGE)
-- Archivo: supabase/migrations/20260905000000_initial_totalanime.sql
-- Versión: 2.4.1 Production-Ready
-- Descripción: Migración fundacional que inicializa todo el ecosistema Supabase
--              PostgreSQL: DDL, Funciones Hardened, RLS, CLS, Grants y Storage CDN.
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: ESQUEMA DDL, ENUMS, TABLAS, ÍNDICES Y TRIGGERS (schema.sql)
-- ==============================================================================

-- 1.1 EXTENSIONES DE POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1.2 TIPOS PERSONALIZADOS Y ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE episode_status AS ENUM ('pending', 'available', 'unavailable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('3_days', '2_days', '1_day');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stream_language AS ENUM ('sub', 'dub');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.3 FUNCIÓN TRIGGER GENÉRICA PARA updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 1.4 PERFILES PÚBLICOS (public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url VARCHAR(255) DEFAULT 'default-avatar.png',
    bio TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1.5 ROLES Y ESTADOS DE USUARIO (public.user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger de Registro Seguro con Manejo de Colisiones de Username y Concurrencia
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INT := 1;
BEGIN
    base_username := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''), SPLIT_PART(NEW.email, '@', 1));
    base_username := REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_]', '_', 'g');
    IF base_username = '' THEN
        base_username := 'user';
    END IF;
    final_username := base_username;

    LOOP
        BEGIN
            INSERT INTO public.profiles (id, username, avatar_url)
            VALUES (NEW.id, final_username, 'default-avatar.png');
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            counter := counter + 1;
            final_username := base_username || '_' || counter;
        END;
    END LOOP;

    INSERT INTO public.user_roles (user_id, role, status)
    VALUES (NEW.id, 'user', 'active');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1.6 TABLA DE GÉNEROS (public.genres)
CREATE TABLE IF NOT EXISTS public.genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE
);

-- 1.7 TABLA DE AVATARES PREDEFINIDOS (public.avatars)
CREATE TABLE IF NOT EXISTS public.avatars (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1.8 TABLA DE ANIMES (public.animes)
CREATE TABLE IF NOT EXISTS public.animes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title_romaji VARCHAR(255),
    title_english VARCHAR(255),
    title_native VARCHAR(255),
    cover_image TEXT,
    banner_image TEXT,
    status VARCHAR(50) DEFAULT 'FINISHED',
    episodes INT DEFAULT 0,
    description TEXT,
    anilist_id INT UNIQUE,
    claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    season_year INT,
    format VARCHAR(50) DEFAULT 'TV',
    slug VARCHAR(255) UNIQUE NOT NULL,
    air_day SMALLINT CHECK (air_day BETWEEN 0 AND 6),
    air_time TIME,
    air_timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
    start_date DATE,
    end_date DATE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_animes_slug ON public.animes(slug);
CREATE INDEX IF NOT EXISTS idx_animes_anilist_id ON public.animes(anilist_id);
CREATE INDEX IF NOT EXISTS idx_animes_name_trgm ON public.animes USING gin (name gin_trgm_ops);

-- 1.9 TABLA RELACIONAL ANIME - GÉNEROS (public.anime_genres)
CREATE TABLE IF NOT EXISTS public.anime_genres (
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

-- 1.10 TABLA DE EPISODIOS (public.episodes)
CREATE TABLE IF NOT EXISTS public.episodes (
    id SERIAL PRIMARY KEY,
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    episode_number INT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    duration INT,
    thumbnail TEXT,
    air_at TIMESTAMPTZ,
    status episode_status DEFAULT 'pending' NOT NULL,
    views INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(anime_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON public.episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_episodes_air_at ON public.episodes(air_at);

-- 1.11 FUENTES DE VIDEO DINÁMICAS (public.episode_sources)
CREATE TABLE IF NOT EXISTS public.episode_sources (
    id BIGSERIAL PRIMARY KEY,
    episode_id INT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    server_name VARCHAR(100) NOT NULL,
    embed_url TEXT NOT NULL,
    direct_stream_url TEXT,
    language stream_language DEFAULT 'sub' NOT NULL,
    quality VARCHAR(20) DEFAULT '1080p' NOT NULL,
    priority SMALLINT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_episode_source UNIQUE (episode_id, provider, language, quality)
);

CREATE INDEX IF NOT EXISTS idx_episode_sources_ep ON public.episode_sources(episode_id, is_active);

-- 1.12 COLA DE SCRAPING ASÍNCRONO (public.scrape_jobs)
CREATE TABLE IF NOT EXISTS public.scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    status job_status DEFAULT 'pending' NOT NULL,
    total_episodes INT DEFAULT 0 NOT NULL,
    processed_episodes INT DEFAULT 0 NOT NULL,
    failed_episodes INT DEFAULT 0 NOT NULL,
    error_log JSONB DEFAULT '[]'::jsonb,
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON public.scrape_jobs(status);

-- 1.13 TABLA DE AUDITORÍA APPEND-ONLY (public.audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);

-- 1.14 ANALÍTICA DIARIA DE VISTAS (public.anime_views)
CREATE TABLE IF NOT EXISTS public.anime_views (
    id BIGSERIAL PRIMARY KEY,
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    view_date DATE DEFAULT CURRENT_DATE NOT NULL,
    views_count INT DEFAULT 1 NOT NULL,
    UNIQUE(anime_id, view_date)
);

-- 1.15 TABLA DE NOTIFICACIONES ADMINISTRATIVAS (public.admin_notifications)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id SERIAL PRIMARY KEY,
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    episode_id INT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    episode_air_date DATE NOT NULL,
    notification_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1.16 TABLA DE HISTORIAL DE USUARIO (public.user_history)
CREATE TABLE IF NOT EXISTS public.user_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    episode_id INT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    progress_seconds INT DEFAULT 0 NOT NULL,
    total_seconds INT DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON public.user_history(user_id, updated_at DESC);

-- 1.17 ESTADO DE EPISODIOS VISTOS (public.user_episode_status)
CREATE TABLE IF NOT EXISTS public.user_episode_status (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    episode_id INT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    is_watched BOOLEAN DEFAULT FALSE NOT NULL,
    watched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, episode_id)
);

-- 1.18 WATCHLIST / FAVORITOS (public.watch_later)
CREATE TABLE IF NOT EXISTS public.watch_later (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_later_user_id ON public.watch_later(user_id);

-- 1.19 CONFIGURACIÓN GLOBAL PÚBLICA (public.app_settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1.20 TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA (updated_at)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_avatars_updated_at ON public.avatars;
CREATE TRIGGER update_avatars_updated_at BEFORE UPDATE ON public.avatars FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_animes_updated_at ON public.animes;
CREATE TRIGGER update_animes_updated_at BEFORE UPDATE ON public.animes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_episodes_updated_at ON public.episodes;
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_episode_sources_updated_at ON public.episode_sources;
CREATE TRIGGER update_episode_sources_updated_at BEFORE UPDATE ON public.episode_sources FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_scrape_jobs_updated_at ON public.scrape_jobs;
CREATE TRIGGER update_scrape_jobs_updated_at BEFORE UPDATE ON public.scrape_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_user_history_updated_at ON public.user_history;
CREATE TRIGGER update_user_history_updated_at BEFORE UPDATE ON public.user_history FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_user_episode_status_updated_at ON public.user_episode_status;
CREATE TRIGGER update_user_episode_status_updated_at BEFORE UPDATE ON public.user_episode_status FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- PARTE 2: FUNCIONES RPC Y ROW LEVEL SECURITY (rls.sql)
-- ==============================================================================

-- 2.1 FUNCIONES DE SEGURIDAD HARDENED (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND status = 'active'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator') AND status = 'active'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_anime(p_anime_id INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: Se requieren permisos de moderación.';
    END IF;

    UPDATE public.animes
    SET claimed_by = auth.uid(),
        claimed_at = NOW()
    WHERE id = p_anime_id 
      AND (claimed_by IS NULL OR public.is_admin());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El anime ya ha sido reclamado por otro moderador o no existe.';
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_anime_view(p_anime_id INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.anime_views (anime_id, view_date, views_count)
    VALUES (p_anime_id, CURRENT_DATE, 1)
    ON CONFLICT (anime_id, view_date)
    DO UPDATE SET views_count = public.anime_views.views_count + 1;

    UPDATE public.animes
    SET views_count = views_count + 1
    WHERE id = p_anime_id;
END;
$$;

-- 2.2 ACTIVACIÓN DE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_episode_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_later ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_views ENABLE ROW LEVEL SECURITY;

-- 2.3 POLÍTICAS RLS
DROP POLICY IF EXISTS "Profiles: Read All" ON public.profiles;
CREATE POLICY "Profiles: Read All" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles: Update Self" ON public.profiles;
CREATE POLICY "Profiles: Update Self" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "UserRoles: Read Self or Admin" ON public.user_roles;
CREATE POLICY "UserRoles: Read Self or Admin" ON public.user_roles FOR SELECT USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS "UserRoles: Admin Write" ON public.user_roles;
CREATE POLICY "UserRoles: Admin Write" ON public.user_roles FOR ALL USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Public: Animes SELECT" ON public.animes;
CREATE POLICY "Public: Animes SELECT" ON public.animes FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: Animes INSERT" ON public.animes;
CREATE POLICY "ModAdmin: Animes INSERT" ON public.animes FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "ModAdmin: Animes UPDATE" ON public.animes;
CREATE POLICY "ModAdmin: Animes UPDATE" ON public.animes FOR UPDATE USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Admin: Animes DELETE" ON public.animes;
CREATE POLICY "Admin: Animes DELETE" ON public.animes FOR DELETE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Public: Episodes SELECT" ON public.episodes;
CREATE POLICY "Public: Episodes SELECT" ON public.episodes FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: Episodes INSERT" ON public.episodes;
CREATE POLICY "ModAdmin: Episodes INSERT" ON public.episodes FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "ModAdmin: Episodes UPDATE" ON public.episodes;
CREATE POLICY "ModAdmin: Episodes UPDATE" ON public.episodes FOR UPDATE USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Admin: Episodes DELETE" ON public.episodes;
CREATE POLICY "Admin: Episodes DELETE" ON public.episodes FOR DELETE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Public: EpisodeSources SELECT" ON public.episode_sources;
CREATE POLICY "Public: EpisodeSources SELECT" ON public.episode_sources FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "ModAdmin: EpisodeSources INSERT" ON public.episode_sources;
CREATE POLICY "ModAdmin: EpisodeSources INSERT" ON public.episode_sources FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "ModAdmin: EpisodeSources UPDATE" ON public.episode_sources;
CREATE POLICY "ModAdmin: EpisodeSources UPDATE" ON public.episode_sources FOR UPDATE USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Admin: EpisodeSources DELETE" ON public.episode_sources;
CREATE POLICY "Admin: EpisodeSources DELETE" ON public.episode_sources FOR DELETE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Public: Genres SELECT" ON public.genres;
CREATE POLICY "Public: Genres SELECT" ON public.genres FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: Genres Manage" ON public.genres;
CREATE POLICY "ModAdmin: Genres Manage" ON public.genres FOR ALL USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Public: AnimeGenres SELECT" ON public.anime_genres;
CREATE POLICY "Public: AnimeGenres SELECT" ON public.anime_genres FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: AnimeGenres Manage" ON public.anime_genres;
CREATE POLICY "ModAdmin: AnimeGenres Manage" ON public.anime_genres FOR ALL USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Public: Avatars SELECT" ON public.avatars;
CREATE POLICY "Public: Avatars SELECT" ON public.avatars FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: Avatars Manage" ON public.avatars;
CREATE POLICY "ModAdmin: Avatars Manage" ON public.avatars FOR ALL USING ((select public.is_moderator_or_admin()));

-- 2.3 POLÍTICAS RLS DE INTERACCIÓN Y OPERACIONES ESPECIALES
DROP POLICY IF EXISTS "UserHistory: Manage Own" ON public.user_history;
CREATE POLICY "UserHistory: Manage Own" ON public.user_history 
    FOR ALL 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()))
    WITH CHECK ((select auth.uid()) = user_id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "EpisodeStatus: Manage Own" ON public.user_episode_status;
CREATE POLICY "EpisodeStatus: Manage Own" ON public.user_episode_status 
    FOR ALL 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()))
    WITH CHECK ((select auth.uid()) = user_id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "WatchLater: Manage Own" ON public.watch_later;
CREATE POLICY "WatchLater: Manage Own" ON public.watch_later 
    FOR ALL 
    USING ((select auth.uid()) = user_id AND (select public.is_active_user()))
    WITH CHECK ((select auth.uid()) = user_id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "AuditLogs: Admin Read Only" ON public.audit_logs;
CREATE POLICY "AuditLogs: Admin Read Only" ON public.audit_logs 
    FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "AnimeViews: Public Read" ON public.anime_views;
CREATE POLICY "AnimeViews: Public Read" ON public.anime_views 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ScrapeJobs: ModAdmin Read Only" ON public.scrape_jobs;
CREATE POLICY "ScrapeJobs: ModAdmin Read Only" ON public.scrape_jobs 
    FOR SELECT USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "AdminNotifications: Moderator Scope" ON public.admin_notifications;
CREATE POLICY "AdminNotifications: Moderator Scope" ON public.admin_notifications 
    FOR ALL USING ((select auth.uid()) = moderator_id OR (select public.is_admin()));

DROP POLICY IF EXISTS "AppSettings: Public Read" ON public.app_settings;
CREATE POLICY "AppSettings: Public Read" ON public.app_settings 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "AppSettings: Admin Write" ON public.app_settings;
CREATE POLICY "AppSettings: Admin Write" ON public.app_settings 
    FOR ALL USING ((select public.is_admin()));

-- ==============================================================================
-- PARTE 3: GRANTS, COLUMN-LEVEL SECURITY Y PERMISOS POR DEFECTO (grants.sql)
-- ==============================================================================

-- 3.1 REVOCACIÓN TOTAL INICIAL
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;

-- 3.2 CONCESIONES PARA ROL 'anon'
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

-- 3.3 CONCESIONES PARA ROL 'authenticated'
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE 
    public.user_history, 
    public.user_episode_status, 
    public.watch_later 
TO authenticated;

GRANT UPDATE (username, avatar_url, bio) ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.app_settings TO authenticated;

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

GRANT INSERT, UPDATE, DELETE ON TABLE 
    public.episodes, 
    public.episode_sources, 
    public.genres, 
    public.anime_genres, 
    public.avatars, 
    public.admin_notifications 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_active_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_anime(INT) TO authenticated;

-- 3.4 CONCESIONES PARA ROL 'service_role' (Backend / Render Worker)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.record_anime_view(INT) TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- ==============================================================================
-- PARTE 4: BUCKETS DE SUPABASE STORAGE Y POLÍTICAS DE CDN (storage.sql)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posters',
    'posters',
    true,
    5242880,
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'banners',
    'banners',
    true,
    8388608,
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    3145728,
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152,
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

DROP POLICY IF EXISTS "Storage: Public Read" ON storage.objects;
CREATE POLICY "Storage: Public Read" ON storage.objects
    FOR SELECT 
    USING (bucket_id IN ('posters', 'banners', 'thumbnails', 'avatars'));

DROP POLICY IF EXISTS "Storage: ModAdmin Catalog Media Manage" ON storage.objects;
CREATE POLICY "Storage: ModAdmin Catalog Media Manage" ON storage.objects
    FOR ALL
    USING (
        bucket_id IN ('posters', 'banners', 'thumbnails') 
        AND (select public.is_moderator_or_admin())
    )
    WITH CHECK (
        bucket_id IN ('posters', 'banners', 'thumbnails') 
        AND (select public.is_moderator_or_admin())
    );

DROP POLICY IF EXISTS "Storage: Avatars User Insert" ON storage.objects;
CREATE POLICY "Storage: Avatars User Insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = (select auth.uid())::text
        AND (select public.is_active_user())
    );

DROP POLICY IF EXISTS "Storage: Avatars User Update" ON storage.objects;
CREATE POLICY "Storage: Avatars User Update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND (
            (storage.foldername(name))[1] = (select auth.uid())::text 
            OR owner_id = (select auth.uid())::text
        )
        AND (select public.is_active_user())
    )
    WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = (select auth.uid())::text
        AND (select public.is_active_user())
    );

DROP POLICY IF EXISTS "Storage: Avatars User Delete" ON storage.objects;
CREATE POLICY "Storage: Avatars User Delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars' 
        AND (
            (storage.foldername(name))[1] = (select auth.uid())::text 
            OR owner_id = (select auth.uid())::text
        )
        AND (select public.is_active_user())
    );


-- ============================================================================
-- FILE: 20260905000001_etl_staging_and_migration_map.sql
-- ============================================================================
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


-- ============================================================================
-- FILE: 20260905000002_scrape_jobs_resilience.sql
-- ============================================================================
-- ==============================================================================
-- TOTALANIME 2.0 - MIGRATION: SCRAPE JOBS RESILIENCE, LEASES & ZOMBIE RECOVERY
-- Archivo: supabase/migrations/20260905000002_scrape_jobs_resilience.sql
-- ==============================================================================

-- 1. Añadir columnas de control de concurrencia y tolerancia a fallos
ALTER TABLE public.scrape_jobs
    ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 3 NOT NULL,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by TEXT,
    ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ;

-- 2. Índice para consultas de recuperación y monitoreo
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_recovery 
    ON public.scrape_jobs(status, locked_at, heartbeat_at);

-- 3. RPC: Reclamar trabajo atómicamente (FOR UPDATE SKIP LOCKED) y recuperar jobs zombis
CREATE OR REPLACE FUNCTION public.claim_next_scrape_job(p_worker_id TEXT)
RETURNS SETOF public.scrape_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- 3.1 Rescatar jobs zombis: 'processing' sin actividad por más de 10 minutos
    -- Se evalúa COALESCE(heartbeat_at, locked_at, updated_at, created_at) para máxima resiliencia
    UPDATE public.scrape_jobs
    SET status = 'pending',
        locked_at = NULL,
        locked_by = NULL
    WHERE status = 'processing'
      AND COALESCE(heartbeat_at, locked_at, updated_at, created_at) < NOW() - INTERVAL '10 minutes'
      AND attempts < max_attempts;

    -- Si attempts >= max_attempts, marcar permanentemente como 'failed'
    UPDATE public.scrape_jobs
    SET status = 'failed',
        error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
                'error', 'Job abandonado por worker inactivo (timeout de heartbeat/lease)',
                'timestamp', NOW()
            )
        )
    WHERE status = 'processing'
      AND COALESCE(heartbeat_at, locked_at, updated_at, created_at) < NOW() - INTERVAL '10 minutes'
      AND attempts >= max_attempts;

    -- 3.2 Reclamar el siguiente job disponible de forma atómica y no bloqueante
    SELECT id INTO v_job_id
    FROM public.scrape_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NOT NULL THEN
        RETURN QUERY
        UPDATE public.scrape_jobs
        SET status = 'processing',
            locked_at = NOW(),
            locked_by = p_worker_id,
            heartbeat_at = NOW(),
            attempts = attempts + 1
        WHERE id = v_job_id
        RETURNING *;
    END IF;

    RETURN;
END;
$$;

-- 4. RPC: Registrar heartbeat periódico del worker
CREATE OR REPLACE FUNCTION public.record_job_heartbeat(p_job_id UUID, p_worker_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE public.scrape_jobs
    SET heartbeat_at = NOW()
    WHERE id = p_job_id
      AND status = 'processing'
      AND (locked_by = p_worker_id OR locked_by IS NULL);

    IF FOUND THEN
        v_updated := TRUE;
    END IF;

    RETURN v_updated;
END;
$$;

-- 5. RPC: Actualizar progreso de scrape job con verificación de worker (Fencing)
CREATE OR REPLACE FUNCTION public.update_scrape_job_progress(
    p_job_id UUID,
    p_worker_id TEXT,
    p_processed INT,
    p_failed INT,
    p_error_log JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE public.scrape_jobs
    SET processed_episodes = p_processed,
        failed_episodes = p_failed,
        error_log = p_error_log,
        heartbeat_at = NOW(),
        updated_at = NOW()
    WHERE id = p_job_id
      AND status = 'processing'
      AND locked_by = p_worker_id;

    IF FOUND THEN
        v_updated := TRUE;
    END IF;

    RETURN v_updated;
END;
$$;

-- 6. RPC: Finalizar scrape job con verificación de worker y limpieza de lease (Fencing)
CREATE OR REPLACE FUNCTION public.finish_scrape_job(
    p_job_id UUID,
    p_worker_id TEXT,
    p_status job_status,
    p_processed INT,
    p_failed INT,
    p_error_log JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE public.scrape_jobs
    SET status = p_status,
        processed_episodes = p_processed,
        failed_episodes = p_failed,
        error_log = p_error_log,
        locked_at = NULL,
        locked_by = NULL,
        heartbeat_at = NULL,
        updated_at = NOW()
    WHERE id = p_job_id
      AND status = 'processing'
      AND locked_by = p_worker_id;

    IF FOUND THEN
        v_updated := TRUE;
    END IF;

    RETURN v_updated;
END;
$$;

-- 7. Privilegios de seguridad (Exclusivo Service Role / Worker backend)
REVOKE EXECUTE ON FUNCTION public.claim_next_scrape_job(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_job_heartbeat(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_scrape_job_progress(UUID, TEXT, INT, INT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finish_scrape_job(UUID, TEXT, job_status, INT, INT, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_next_scrape_job(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_job_heartbeat(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_scrape_job_progress(UUID, TEXT, INT, INT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_scrape_job(UUID, TEXT, job_status, INT, INT, JSONB) TO service_role;


-- ============================================================================
-- FILE: 20260905000003_admin_hardening_and_sources_rls.sql
-- ============================================================================
-- ==============================================================================
-- TOTALANIME 2.0 - MIGRATION: EPISODE SOURCES SELECT ALL FOR STAFF
-- Archivo: supabase/migrations/20260905000003_admin_hardening_and_sources_rls.sql
-- ==============================================================================

-- 1. Permitir a Moderadores y Administradores ver todas las fuentes
--    (incluidas las fuentes en cuarentena o inactivas con is_active = false)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'episode_sources' 
          AND policyname = 'ModAdmin: EpisodeSources SELECT All'
    ) THEN
        CREATE POLICY "ModAdmin: EpisodeSources SELECT All"
        ON public.episode_sources
        FOR SELECT
        USING ((select public.is_moderator_or_admin()));
    END IF;
END $$;


-- ============================================================================
-- FILE: 20260905000004_centralize_sources_mutations_and_sync_availability.sql
-- ============================================================================
-- ==============================================================================
-- TOTALANIME 2.0 - MIGRATION 004: CENTRALIZE EPISODE SOURCES MUTATIONS & SYNC STATUS
-- Archivo: supabase/migrations/20260905000004_centralize_sources_mutations_and_sync_availability.sql
-- ==============================================================================

-- 1. Revocar mutaciones directas de episode_sources para authenticated / anon
--    Todas las inserciones, actualizaciones y borrados deben ejecutarse exclusivamente
--    a través del backend API (Render) utilizando el rol 'service_role'.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.episode_sources FROM authenticated, anon, PUBLIC;
GRANT SELECT ON TABLE public.episode_sources TO anon, authenticated;

-- 2. Eliminar policies de mutación en RLS para clientes directos
DROP POLICY IF EXISTS "ModAdmin: EpisodeSources INSERT" ON public.episode_sources;
DROP POLICY IF EXISTS "ModAdmin: EpisodeSources UPDATE" ON public.episode_sources;
DROP POLICY IF EXISTS "Admin: EpisodeSources DELETE" ON public.episode_sources;

-- Asegurar que las policies de lectura SELECT permanezcan activas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'episode_sources' 
          AND policyname = 'Public: EpisodeSources SELECT'
    ) THEN
        CREATE POLICY "Public: EpisodeSources SELECT"
        ON public.episode_sources
        FOR SELECT
        USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'episode_sources' 
          AND policyname = 'ModAdmin: EpisodeSources SELECT All'
    ) THEN
        CREATE POLICY "ModAdmin: EpisodeSources SELECT All"
        ON public.episode_sources
        FOR SELECT
        USING ((select public.is_moderator_or_admin()));
    END IF;
END $$;

-- 3. Función y Trigger para sincronizar automáticamente episodes.status según fuentes activas
CREATE OR REPLACE FUNCTION public.trg_sync_episode_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_target_ep_id INT;
    v_active_count INT;
BEGIN
    v_target_ep_id := COALESCE(NEW.episode_id, OLD.episode_id);

    IF v_target_ep_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(*)
    INTO v_active_count
    FROM public.episode_sources
    WHERE episode_id = v_target_ep_id
      AND is_active = true;

    IF v_active_count > 0 THEN
        UPDATE public.episodes
        SET status = 'available',
            updated_at = NOW()
        WHERE id = v_target_ep_id
          AND status != 'available';
    ELSE
        UPDATE public.episodes
        SET status = 'pending',
            updated_at = NOW()
        WHERE id = v_target_ep_id
          AND status = 'available';
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_episode_sources_sync_availability ON public.episode_sources;
CREATE TRIGGER trg_episode_sources_sync_availability
    AFTER INSERT OR UPDATE OF is_active, episode_id OR DELETE ON public.episode_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_sync_episode_availability();

