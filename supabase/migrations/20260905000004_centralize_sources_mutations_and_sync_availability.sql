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
