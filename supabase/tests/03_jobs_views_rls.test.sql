-- ==============================================================================
-- PRUEBAS DE SEGURIDAD: SCRAPE_JOBS, ANIME_VIEWS Y AUDIT_LOGS
-- Archivo: supabase/tests/03_jobs_views_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(5);

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

-- 1. Test: Usuario autenticado no puede insertar directamente en scrape_jobs
SELECT throws_ok(
    $$ INSERT INTO public.scrape_jobs (anime_id, status) VALUES (1, 'completed') $$,
    NULL,
    'Clientes autenticados no pueden crear filas en scrape_jobs (solo Render Secret Key)'
);

-- 2. Test: Usuario autenticado no puede manipular el estado de scrape_jobs
SELECT throws_ok(
    $$ UPDATE public.scrape_jobs SET status = 'completed', processed_episodes = 9999 WHERE id = '44444444-4444-4444-4444-444444444444' $$,
    NULL,
    'Clientes no pueden modificar scrape_jobs'
);

-- 3. Test: Clientes no pueden insertar directamente en anime_views (solo RPC / Secret Key)
SELECT throws_ok(
    $$ INSERT INTO public.anime_views (anime_id, view_date, views_count) VALUES (1, CURRENT_DATE, 999999) $$,
    NULL,
    'Clientes no pueden insertar artificialmente en anime_views'
);

-- 4. Test: Clientes no administradores no pueden leer audit_logs
SELECT is_empty(
    $$ SELECT * FROM public.audit_logs $$,
    'audit_logs solo es visible para Administradores'
);

-- 5. Test: Anon y authenticated pueden ejecutar record_anime_view() de forma segura
SELECT lives_ok(
    $$ SELECT public.record_anime_view(1) $$,
    'record_anime_view() es invocable por clientes para registrar vistas legítimas'
);

SELECT * FROM finish();
ROLLBACK;
