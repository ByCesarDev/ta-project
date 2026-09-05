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
