-- ==============================================================================
-- TOTALANIME 2.0 - POLÍTICAS ROW LEVEL SECURITY (RLS) Y FUNCIONES RPC
-- Archivo: supabase/rls.sql
-- Versión: 2.4.1 Production-Ready
-- Descripción: Funciones de seguridad hardened (SECURITY DEFINER + search_path = ''),
--              activación de RLS en todas las tablas y políticas de acceso fino.
-- ==============================================================================

-- ========================================================
-- 1. FUNCIONES DE SEGURIDAD HARDENED (SECURITY DEFINER)
-- ========================================================

-- 1.1 Helper: ¿Es Usuario Activo?
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

-- 1.2 Helper: ¿Es Administrador?
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

-- 1.3 Helper: ¿Es Moderador o Administrador?
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

-- 1.4 Función RPC: Reclamar Anime de Forma Segura (Evita bypass en UPDATE animes)
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

-- 1.5 Función RPC: Registrar Visualización Diaria
CREATE OR REPLACE FUNCTION public.record_anime_view(p_anime_id INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- 1. Incrementar contador diario
    INSERT INTO public.anime_views (anime_id, view_date, views_count)
    VALUES (p_anime_id, CURRENT_DATE, 1)
    ON CONFLICT (anime_id, view_date)
    DO UPDATE SET views_count = public.anime_views.views_count + 1;

    -- 2. Incrementar contador global O(1)
    UPDATE public.animes
    SET views_count = views_count + 1
    WHERE id = p_anime_id;
END;
$$;

-- ========================================================
-- 2. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
-- ========================================================
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

-- ========================================================
-- 3. POLÍTICAS RLS POR TABLA
-- ========================================================

-- --- 3.1 PROFILES & USER_ROLES ---
DROP POLICY IF EXISTS "Profiles: Read All" ON public.profiles;
CREATE POLICY "Profiles: Read All" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles: Update Self" ON public.profiles;
CREATE POLICY "Profiles: Update Self" ON public.profiles
    FOR UPDATE USING ((select auth.uid()) = id AND (select public.is_active_user()));

DROP POLICY IF EXISTS "UserRoles: Read Self or Admin" ON public.user_roles;
CREATE POLICY "UserRoles: Read Self or Admin" ON public.user_roles
    FOR SELECT USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS "UserRoles: Admin Write" ON public.user_roles;
CREATE POLICY "UserRoles: Admin Write" ON public.user_roles
    FOR ALL USING ((select public.is_admin()));

-- --- 3.2 CATÁLOGO DE ANIMES Y EPISODIOS ---
DROP POLICY IF EXISTS "Public: Animes SELECT" ON public.animes;
CREATE POLICY "Public: Animes SELECT" ON public.animes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: Animes INSERT" ON public.animes;
CREATE POLICY "ModAdmin: Animes INSERT" ON public.animes
    FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "ModAdmin: Animes UPDATE" ON public.animes;
CREATE POLICY "ModAdmin: Animes UPDATE" ON public.animes
    FOR UPDATE USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Admin: Animes DELETE" ON public.animes;
CREATE POLICY "Admin: Animes DELETE" ON public.animes
    FOR DELETE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Public: Episodes SELECT" ON public.episodes;
CREATE POLICY "Public: Episodes SELECT" ON public.episodes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ModAdmin: Episodes INSERT" ON public.episodes;
CREATE POLICY "ModAdmin: Episodes INSERT" ON public.episodes
    FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "ModAdmin: Episodes UPDATE" ON public.episodes;
CREATE POLICY "ModAdmin: Episodes UPDATE" ON public.episodes
    FOR UPDATE USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Admin: Episodes DELETE" ON public.episodes;
CREATE POLICY "Admin: Episodes DELETE" ON public.episodes
    FOR DELETE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "Public: EpisodeSources SELECT" ON public.episode_sources;
CREATE POLICY "Public: EpisodeSources SELECT" ON public.episode_sources
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "ModAdmin: EpisodeSources INSERT" ON public.episode_sources;
CREATE POLICY "ModAdmin: EpisodeSources INSERT" ON public.episode_sources
    FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "ModAdmin: EpisodeSources UPDATE" ON public.episode_sources;
CREATE POLICY "ModAdmin: EpisodeSources UPDATE" ON public.episode_sources
    FOR UPDATE USING ((select public.is_moderator_or_admin()));

DROP POLICY IF EXISTS "Admin: EpisodeSources DELETE" ON public.episode_sources;
CREATE POLICY "Admin: EpisodeSources DELETE" ON public.episode_sources
    FOR DELETE USING ((select public.is_admin()));

-- --- 3.3 METADATOS ESTÁTICOS ---
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

-- --- 3.4 INTERACCIÓN DE USUARIOS AUTENTICADOS ACTIVOS ---
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

-- --- 3.5 AUDITORÍA, VISTAS, JOBS Y NOTIFICACIONES ---
DROP POLICY IF EXISTS "AuditLogs: Admin Read Only" ON public.audit_logs;
CREATE POLICY "AuditLogs: Admin Read Only" ON public.audit_logs 
    FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "AnimeViews: Public Read" ON public.anime_views;
CREATE POLICY "AnimeViews: Public Read" ON public.anime_views 
    FOR SELECT USING (true);
-- Nota: anime_views no tiene policies de INSERT/UPDATE para clientes; se actualiza exclusivamente por record_anime_view() o Backend Secret Key.

DROP POLICY IF EXISTS "ScrapeJobs: ModAdmin Read Only" ON public.scrape_jobs;
CREATE POLICY "ScrapeJobs: ModAdmin Read Only" ON public.scrape_jobs 
    FOR SELECT USING ((select public.is_moderator_or_admin()));
-- Nota: scrape_jobs no tiene policies de INSERT/UPDATE para clientes; la creación/actualización la realiza el worker de Render vía Secret Key.

DROP POLICY IF EXISTS "AdminNotifications: Moderator Scope" ON public.admin_notifications;
CREATE POLICY "AdminNotifications: Moderator Scope" ON public.admin_notifications 
    FOR ALL USING ((select auth.uid()) = moderator_id OR (select public.is_admin()));

DROP POLICY IF EXISTS "AppSettings: Public Read" ON public.app_settings;
CREATE POLICY "AppSettings: Public Read" ON public.app_settings 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "AppSettings: Admin Write" ON public.app_settings;
CREATE POLICY "AppSettings: Admin Write" ON public.app_settings 
    FOR ALL USING ((select public.is_admin()));
