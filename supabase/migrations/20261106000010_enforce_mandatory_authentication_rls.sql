-- ==============================================================================
-- Migration: 20261106000010_enforce_mandatory_authentication_rls.sql
-- Description: Enforce mandatory authentication across catalog, series, seasons,
--              episodes, sources, and genres. Anonymous (anon) users cannot read
--              catalog or episode data directly from PostgREST/Supabase.
-- ==============================================================================

-- 1. REVOKE SELECT PRIVILEGES FROM ANON
REVOKE SELECT ON TABLE public.series FROM anon;
REVOKE SELECT ON TABLE public.series_seasons FROM anon;
REVOKE SELECT ON TABLE public.series_entries FROM anon;
REVOKE SELECT ON TABLE public.animes FROM anon;
REVOKE SELECT ON TABLE public.episodes FROM anon;
REVOKE SELECT ON TABLE public.episode_sources FROM anon;
REVOKE SELECT ON TABLE public.genres FROM anon;
REVOKE SELECT ON TABLE public.anime_genres FROM anon;

-- 2. ENSURE SELECT PRIVILEGES FOR AUTHENTICATED AND SERVICE_ROLE
GRANT SELECT ON TABLE public.series TO authenticated, service_role;
GRANT SELECT ON TABLE public.series_seasons TO authenticated, service_role;
GRANT SELECT ON TABLE public.series_entries TO authenticated, service_role;
GRANT SELECT ON TABLE public.animes TO authenticated, service_role;
GRANT SELECT ON TABLE public.episodes TO authenticated, service_role;
GRANT SELECT ON TABLE public.episode_sources TO authenticated, service_role;
GRANT SELECT ON TABLE public.genres TO authenticated, service_role;
GRANT SELECT ON TABLE public.anime_genres TO authenticated, service_role;

-- 3. UPDATE ROW LEVEL SECURITY (RLS) POLICIES TO REQUIRE AUTHENTICATION

-- 3.1 Series
DROP POLICY IF EXISTS "Series: Public Read" ON public.series;
DROP POLICY IF EXISTS "Series: Authenticated Read" ON public.series;
CREATE POLICY "Series: Authenticated Read"
    ON public.series
    FOR SELECT
    TO authenticated
    USING (true);

-- 3.2 Series Seasons
DROP POLICY IF EXISTS "SeriesSeasons: Public Read" ON public.series_seasons;
DROP POLICY IF EXISTS "SeriesSeasons: Authenticated Read" ON public.series_seasons;
CREATE POLICY "SeriesSeasons: Authenticated Read"
    ON public.series_seasons
    FOR SELECT
    TO authenticated
    USING (true);

-- 3.3 Series Entries
DROP POLICY IF EXISTS "SeriesEntries: Public Read" ON public.series_entries;
DROP POLICY IF EXISTS "SeriesEntries: Authenticated Read" ON public.series_entries;
CREATE POLICY "SeriesEntries: Authenticated Read"
    ON public.series_entries
    FOR SELECT
    TO authenticated
    USING (true);

-- 3.4 Animes
DROP POLICY IF EXISTS "Public: Animes SELECT" ON public.animes;
DROP POLICY IF EXISTS "Animes: Authenticated Read" ON public.animes;
CREATE POLICY "Animes: Authenticated Read"
    ON public.animes
    FOR SELECT
    TO authenticated
    USING (true);

-- 3.5 Episodes
DROP POLICY IF EXISTS "Public: Episodes SELECT" ON public.episodes;
DROP POLICY IF EXISTS "Episodes: Authenticated Read" ON public.episodes;
CREATE POLICY "Episodes: Authenticated Read"
    ON public.episodes
    FOR SELECT
    TO authenticated
    USING (true);

-- 3.6 Episode Sources
DROP POLICY IF EXISTS "Public: EpisodeSources SELECT" ON public.episode_sources;
DROP POLICY IF EXISTS "EpisodeSources: Authenticated Read" ON public.episode_sources;
CREATE POLICY "EpisodeSources: Authenticated Read"
    ON public.episode_sources
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- 3.7 Genres & Anime Genres
DROP POLICY IF EXISTS "Public: Genres SELECT" ON public.genres;
DROP POLICY IF EXISTS "Genres: Authenticated Read" ON public.genres;
CREATE POLICY "Genres: Authenticated Read"
    ON public.genres
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Public: AnimeGenres SELECT" ON public.anime_genres;
DROP POLICY IF EXISTS "AnimeGenres: Authenticated Read" ON public.anime_genres;
CREATE POLICY "AnimeGenres: Authenticated Read"
    ON public.anime_genres
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. RECARGA DE CACHÉ DE ESQUEMA EN POSTGREST
NOTIFY pgrst, 'reload schema';
