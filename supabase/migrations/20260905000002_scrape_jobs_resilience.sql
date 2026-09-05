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
