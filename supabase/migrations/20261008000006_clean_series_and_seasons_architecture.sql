-- ==============================================================================
-- TOTALANIME 2.0 - SISTEMA DE SERIES, TEMPORADAS Y ENTREGAS (CLEAN ARCHITECTURE)
-- Archivo: supabase/migrations/20261008000006_clean_series_and_seasons_architecture.sql
-- ==============================================================================

-- 1. TABLA PRINCIPAL: series
CREATE TABLE IF NOT EXISTS public.series (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_image TEXT,
    banner_image TEXT,
    status TEXT NOT NULL DEFAULT 'finalizado',
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    views_count BIGINT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_slug ON public.series(slug);
CREATE INDEX IF NOT EXISTS idx_series_status ON public.series(status);
CREATE INDEX IF NOT EXISTS idx_series_views ON public.series(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_series_claimed ON public.series(claimed_by);

-- 2. TABLA DE TEMPORADAS / SECCIONES: series_seasons
CREATE TABLE IF NOT EXISTS public.series_seasons (
    id BIGSERIAL PRIMARY KEY,
    series_id BIGINT NOT NULL REFERENCES public.series(id) ON DELETE RESTRICT,
    season_number INT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'season' CHECK (kind IN ('season', 'movie', 'special', 'ova')),
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_seasons_series ON public.series_seasons(series_id, display_order);

-- 3. TABLA DE ENTREGAS VINCULADAS (AniList / animes): series_entries
CREATE TABLE IF NOT EXISTS public.series_entries (
    id BIGSERIAL PRIMARY KEY,
    season_id BIGINT NOT NULL REFERENCES public.series_seasons(id) ON DELETE RESTRICT,
    anime_id BIGINT NOT NULL UNIQUE REFERENCES public.animes(id) ON DELETE RESTRICT,
    display_order INT NOT NULL DEFAULT 1,
    part_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_entries_season ON public.series_entries(season_id, display_order);
CREATE INDEX IF NOT EXISTS idx_series_entries_anime ON public.series_entries(anime_id);

-- 4. TABLA DE BINDINGS DE FUENTES PARA SCRAPING: anime_source_bindings
CREATE TABLE IF NOT EXISTS public.anime_source_bindings (
    id BIGSERIAL PRIMARY KEY,
    anime_id BIGINT NOT NULL UNIQUE REFERENCES public.animes(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'dramasfree',
    source_url TEXT NOT NULL,
    source_season_id TEXT,
    audio_variants_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    episode_offset_map JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anime_source_bindings_anime ON public.anime_source_bindings(anime_id);

-- 5. TABLA DE REDIRECCIONES Y ALIAS HISTÓRICOS: series_slug_redirects
CREATE TABLE IF NOT EXISTS public.series_slug_redirects (
    old_slug TEXT PRIMARY KEY,
    target_series_id BIGINT NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
    target_season_id BIGINT REFERENCES public.series_seasons(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_slug_redirects_target ON public.series_slug_redirects(target_series_id);

-- 6. TABLA DE FAVORITOS DE USUARIO POR SERIE: user_favorites
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id BIGINT NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_series ON public.user_favorites(series_id);

-- 7. COLUMNA DE SNAPSHOT EN scrape_jobs
ALTER TABLE public.scrape_jobs
ADD COLUMN IF NOT EXISTS source_config JSONB DEFAULT NULL;

-- 8. TRIGGERS updated_at
CREATE OR REPLACE TRIGGER set_updated_at_series
BEFORE UPDATE ON public.series
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_series_seasons
BEFORE UPDATE ON public.series_seasons
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_anime_source_bindings
BEFORE UPDATE ON public.anime_source_bindings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. FUNCIONES DE MODERACIÓN Y VISUALIZACIONES
CREATE OR REPLACE FUNCTION public.claim_series(p_series_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_moderator_or_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: Se requieren permisos de moderación.';
    END IF;

    UPDATE public.series
    SET claimed_by = auth.uid(),
        claimed_at = NOW()
    WHERE id = p_series_id 
      AND (claimed_by IS NULL OR public.is_admin());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La serie ya ha sido reclamada por otro moderador o no existe.';
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_series_view(p_series_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.series
    SET views_count = views_count + 1
    WHERE id = p_series_id;
END;
$$;

-- 10. SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_source_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 10.1 Policies for series
CREATE POLICY "Series: Public Read" ON public.series
    FOR SELECT USING (true);

CREATE POLICY "Series: Mod/Admin Write" ON public.series
    FOR INSERT WITH CHECK ((select public.is_moderator_or_admin()));

CREATE POLICY "Series: Mod/Admin Update" ON public.series
    FOR UPDATE USING (
        (select public.is_admin()) OR 
        ((select public.is_moderator_or_admin()) AND (claimed_by = (select auth.uid()) OR claimed_by IS NULL))
    );

CREATE POLICY "Series: Admin Delete" ON public.series
    FOR DELETE USING ((select public.is_admin()));

-- 10.2 Policies for series_seasons
CREATE POLICY "SeriesSeasons: Public Read" ON public.series_seasons
    FOR SELECT USING (true);

CREATE POLICY "SeriesSeasons: Mod/Admin Write" ON public.series_seasons
    FOR ALL USING ((select public.is_moderator_or_admin()));

-- 10.3 Policies for series_entries
CREATE POLICY "SeriesEntries: Public Read" ON public.series_entries
    FOR SELECT USING (true);

CREATE POLICY "SeriesEntries: Mod/Admin Write" ON public.series_entries
    FOR ALL USING ((select public.is_moderator_or_admin()));

-- 10.4 Policies for anime_source_bindings
CREATE POLICY "AnimeSourceBindings: Mod/Admin Read" ON public.anime_source_bindings
    FOR SELECT USING ((select public.is_moderator_or_admin()));

CREATE POLICY "AnimeSourceBindings: Mod/Admin Write" ON public.anime_source_bindings
    FOR ALL USING ((select public.is_moderator_or_admin()));

-- 10.5 Policies for series_slug_redirects
CREATE POLICY "SeriesSlugRedirects: Public Read" ON public.series_slug_redirects
    FOR SELECT USING (true);

CREATE POLICY "SeriesSlugRedirects: Admin Write" ON public.series_slug_redirects
    FOR ALL USING ((select public.is_admin()));

-- 10.6 Policies for user_favorites
CREATE POLICY "UserFavorites: Owner Read" ON public.user_favorites
    FOR SELECT USING ((select auth.uid()) = user_id OR (select public.is_admin()));

CREATE POLICY "UserFavorites: Owner Insert" ON public.user_favorites
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "UserFavorites: Owner Delete" ON public.user_favorites
    FOR DELETE USING ((select auth.uid()) = user_id);

-- 11. PERMISOS Y GRANTS
GRANT ALL ON public.series TO service_role, postgres;
GRANT ALL ON public.series_seasons TO service_role, postgres;
GRANT ALL ON public.series_entries TO service_role, postgres;
GRANT ALL ON public.anime_source_bindings TO service_role, postgres;
GRANT ALL ON public.series_slug_redirects TO service_role, postgres;
GRANT ALL ON public.user_favorites TO service_role, postgres;

GRANT SELECT ON public.series TO anon, authenticated;
GRANT SELECT ON public.series_seasons TO anon, authenticated;
GRANT SELECT ON public.series_entries TO anon, authenticated;
GRANT SELECT ON public.series_slug_redirects TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.series TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.series_seasons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.series_entries TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.anime_source_bindings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;

GRANT EXECUTE ON FUNCTION public.claim_series(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_series_view(BIGINT) TO anon, authenticated;
