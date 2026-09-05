-- ==============================================================================
-- TOTALANIME 2.0 - ESQUEMA DDL DE BASE DE DATOS POSTGRESQL (Supabase)
-- Archivo: supabase/schema.sql
-- Versión: 2.4.1 Production-Ready
-- Descripción: Creación de extensiones, tipos ENUM, 16 tablas relacionales,
--              triggers de usuario / concurrencia / updated_at e índices de alto rendimiento.
-- ==============================================================================

-- ========================================================
-- 1. EXTENSIONES DE POSTGRESQL
-- ========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================================
-- 2. TIPOS PERSONALIZADOS Y ENUMS
-- ========================================================
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

-- ========================================================
-- 3. FUNCIÓN TRIGGER GENÉRICA PARA updated_at
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ========================================================
-- 4. PERFILES PÚBLICOS (public.profiles)
-- Sin email ni roles para máxima privacidad y seguridad.
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url VARCHAR(255) DEFAULT 'default-avatar.png',
    bio TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================================
-- 5. ROLES Y ESTADOS DE USUARIO (public.user_roles)
-- Separado de profiles: SOLO modificable por Administradores.
-- ========================================================
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
    -- Reemplazar caracteres no alfanuméricos por guiones bajos
    base_username := REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_]', '_', 'g');
    IF base_username = '' THEN
        base_username := 'user';
    END IF;
    final_username := base_username;

    -- Manejar colisiones de username en bucle transaccional seguro
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, username, avatar_url)
            VALUES (NEW.id, final_username, 'default-avatar.png');
            EXIT; -- Inserción exitosa
        EXCEPTION WHEN unique_violation THEN
            counter := counter + 1;
            final_username := base_username || '_' || counter;
        END;
    END LOOP;

    -- Asignar Rol 'user' incondicionalmente
    INSERT INTO public.user_roles (user_id, role, status)
    VALUES (NEW.id, 'user', 'active');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- 6. TABLA DE GÉNEROS (public.genres)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE
);

-- ========================================================
-- 7. TABLA DE AVATARES PREDEFINIDOS (public.avatars)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.avatars (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================================
-- 8. TABLA DE ANIMES (public.animes)
-- ========================================================
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

-- ========================================================
-- 9. TABLA RELACIONAL ANIME - GÉNEROS (public.anime_genres)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.anime_genres (
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

-- ========================================================
-- 10. TABLA DE EPISODIOS (public.episodes)
-- ========================================================
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

-- ========================================================
-- 11. FUENTES DE VIDEO DINÁMICAS (public.episode_sources)
-- Idempotencia garantizada por UNIQUE (episode_id, provider, language, quality)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.episode_sources (
    id BIGSERIAL PRIMARY KEY,
    episode_id INT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'mega', 'streamtape', 'streamwish', 'filemoon', etc.
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

-- ========================================================
-- 12. COLA DE SCRAPING ASÍNCRONO (public.scrape_jobs)
-- ========================================================
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

-- ========================================================
-- 13. TABLA DE AUDITORÍA APPEND-ONLY (public.audit_logs)
-- ========================================================
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

-- ========================================================
-- 14. ANALÍTICA DIARIA DE VISTAS (public.anime_views)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.anime_views (
    id BIGSERIAL PRIMARY KEY,
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    view_date DATE DEFAULT CURRENT_DATE NOT NULL,
    views_count INT DEFAULT 1 NOT NULL,
    UNIQUE(anime_id, view_date)
);

-- ========================================================
-- 15. TABLA DE NOTIFICACIONES ADMINISTRATIVAS (public.admin_notifications)
-- ========================================================
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

-- ========================================================
-- 16. TABLA DE HISTORIAL DE USUARIO (public.user_history)
-- ========================================================
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

-- ========================================================
-- 17. ESTADO DE EPISODIOS VISTOS (public.user_episode_status)
-- ========================================================
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

-- ========================================================
-- 18. WATCHLIST / FAVORITOS (public.watch_later)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.watch_later (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    anime_id INT NOT NULL REFERENCES public.animes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_later_user_id ON public.watch_later(user_id);

-- ========================================================
-- 19. CONFIGURACIÓN GLOBAL PÚBLICA (public.app_settings)
-- ⚠️ ADVERTENCIA: SOLO CONFIGURACIONES PÚBLICAS (CERO SECRETOS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================================
-- 20. TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA (updated_at)
-- ========================================================
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
