-- ==============================================================================
-- TOTALANIME 2.0 - MIGRATION 005: MULTI-AUDIO EPISODE SOURCES & SCRAPING V2
-- Archivo: supabase/migrations/20261008000005_multi_audio_sources_and_scraping_v2.sql
-- ==============================================================================

-- 1. Actualizaciones en la tabla public.animes
ALTER TABLE public.animes
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'cluster',
    ADD COLUMN IF NOT EXISTS discovered_variants JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_animes_source_id ON public.animes(source_id);

-- 2. Actualizaciones en la tabla public.episodes
ALTER TABLE public.episodes
    ADD COLUMN IF NOT EXISTS source_episode_id VARCHAR(100);

-- Permitir números de episodio decimales (ej. 12.5 para OVAS/Especiales)
ALTER TABLE public.episodes 
    ALTER COLUMN episode_number TYPE NUMERIC(6,1) USING episode_number::NUMERIC(6,1);

-- 3. Actualizaciones en la tabla public.episode_sources
ALTER TABLE public.episode_sources
    ADD COLUMN IF NOT EXISTS audio_variant VARCHAR(80) DEFAULT 'default' NOT NULL,
    ADD COLUMN IF NOT EXISTS audio_language VARCHAR(20) DEFAULT 'und' NOT NULL,
    ADD COLUMN IF NOT EXISTS language_label VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source_key VARCHAR(100) DEFAULT 'default' NOT NULL,
    ADD COLUMN IF NOT EXISTS subtitles JSONB DEFAULT '[]'::jsonb;

-- 3.1 Retrocompatibilidad: Asignar identidades a registros existentes
UPDATE public.episode_sources
SET audio_variant = 'dub_latino',
    audio_language = 'es-419',
    language_label = 'Español Latino'
WHERE language = 'dub' AND (audio_variant = 'default' OR audio_variant IS NULL);

UPDATE public.episode_sources
SET audio_variant = 'original',
    audio_language = 'ja',
    language_label = 'Japonés (Original)'
WHERE language = 'sub' AND (audio_variant = 'default' OR audio_variant IS NULL);

-- 3.2 Eliminar restricciones únicas anteriores dinámicamente y crear uq_episode_source_v2
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.episode_sources'::regclass 
          AND contype = 'u'
          AND conname NOT LIKE '%_pkey'
    ) LOOP
        EXECUTE 'ALTER TABLE public.episode_sources DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE public.episode_sources
    ADD CONSTRAINT uq_episode_source_v2 UNIQUE (episode_id, provider, audio_variant, source_key, quality);

CREATE INDEX IF NOT EXISTS idx_episode_sources_variant 
    ON public.episode_sources(episode_id, audio_variant, is_active);

-- 4. Actualizaciones en la tabla public.scrape_jobs
ALTER TABLE public.scrape_jobs
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS frozen_config JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS target_mode VARCHAR(30) DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS target_episode_number NUMERIC(6,1);

-- Permitir valor 'partial' en el enum job_status si existe
DO $$
BEGIN
    ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'partial';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
