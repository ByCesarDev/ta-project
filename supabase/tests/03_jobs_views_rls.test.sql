-- ==============================================================================
-- PRUEBAS DE SEGURIDAD: SCRAPE_JOBS, ANIME_VIEWS Y AUDIT_LOGS
-- Archivo: supabase/tests/03_jobs_views_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(7);

-- -----------------------------------------------------------------------------
-- 1. FIXTURES: Crear usuarios, anime, job y audit log de prueba
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user@totalanime.test', 'encrypted', '{"username": "regular_user"}'::jsonb, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mod@totalanime.test', 'encrypted', '{"username": "moderator"}'::jsonb, NOW(), NOW()),
    ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@totalanime.test', 'encrypted', '{"username": "admin_user"}'::jsonb, NOW(), NOW());

UPDATE public.user_roles SET role = 'moderator' WHERE user_id = '33333333-3333-3333-3333-333333333333';
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '99999999-9999-9999-9999-999999999999';

-- Crear anime
INSERT INTO public.animes (id, name, slug) VALUES (200, 'One Piece', 'one-piece');

-- Crear job de prueba (como servicio interno)
INSERT INTO public.scrape_jobs (id, anime_id, status, total_episodes, processed_episodes)
VALUES ('55555555-5555-5555-5555-555555555555', 200, 'processing', 1100, 50);

-- Crear log de auditoría
INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id)
VALUES ('99999999-9999-9999-9999-999999999999', 'UPDATE_ROLE', 'user_roles', '11111111-1111-1111-1111-111111111111');

-- -----------------------------------------------------------------------------
-- 2. TEST: Usuario autenticado no tiene permisos de INSERT en scrape_jobs
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
    $$ INSERT INTO public.scrape_jobs (anime_id, status) VALUES (200, 'completed') $$,
    NULL,
    'Clientes autenticados no pueden hacer INSERT en scrape_jobs (bloqueado por GRANT)'
);

-- -----------------------------------------------------------------------------
-- 3. TEST: Usuario autenticado no tiene permisos de UPDATE en scrape_jobs
-- -----------------------------------------------------------------------------
SELECT throws_ok(
    $$ UPDATE public.scrape_jobs SET status = 'completed' WHERE id = '55555555-5555-5555-5555-555555555555' $$,
    NULL,
    'Clientes autenticados no pueden hacer UPDATE en scrape_jobs (bloqueado por GRANT)'
);

-- -----------------------------------------------------------------------------
-- 4. TEST: Moderador SÍ puede leer scrape_jobs para monitorear progreso
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333';

SELECT is(
    (SELECT status::text FROM public.scrape_jobs WHERE id = '55555555-5555-5555-5555-555555555555'),
    'processing',
    'Moderadores autenticados pueden observar scrape_jobs vía SELECT'
);

-- -----------------------------------------------------------------------------
-- 5. TEST: Clientes no pueden insertar directamente en anime_views
-- -----------------------------------------------------------------------------
SELECT throws_ok(
    $$ INSERT INTO public.anime_views (anime_id, view_date, views_count) VALUES (200, CURRENT_DATE, 999999) $$,
    NULL,
    'Clientes autenticados no pueden insertar artificialmente en anime_views (bloqueado por GRANT)'
);

-- -----------------------------------------------------------------------------
-- 6. TEST: Usuario normal no puede ver registros de audit_logs (RLS)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT is_empty(
    $$ SELECT * FROM public.audit_logs $$,
    'RLS debe ocultar los registros de audit_logs para usuarios no administradores'
);

-- -----------------------------------------------------------------------------
-- 7. TEST: Administrador SÍ puede consultar audit_logs (RLS)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999999';

SELECT is(
    (SELECT action FROM public.audit_logs LIMIT 1),
    'UPDATE_ROLE',
    'Administradores pueden auditar las acciones registradas en audit_logs'
);

-- -----------------------------------------------------------------------------
-- 8. TEST: record_anime_view() bloqueado para llamadas directas de clientes
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;

SELECT throws_ok(
    $$ SELECT public.record_anime_view(200) $$,
    NULL,
    'record_anime_view() debe rechazar llamadas directas de clientes no autorizados (anti-spam)'
);

SELECT * FROM finish();
ROLLBACK;
