-- ==============================================================================
-- PRUEBAS DE SEGURIDAD: COLUMN-LEVEL SECURITY (INSERT/UPDATE) Y CLAIM_ANIME
-- Archivo: supabase/tests/02_anime_cls_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(7);

-- -----------------------------------------------------------------------------
-- 1. FIXTURES: Crear moderadores, usuarios y anime de prueba
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user@totalanime.test', 'encrypted', '{"username": "regular_user"}'::jsonb, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mod1@totalanime.test', 'encrypted', '{"username": "moderator_1"}'::jsonb, NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mod2@totalanime.test', 'encrypted', '{"username": "moderator_2"}'::jsonb, NOW(), NOW());

UPDATE public.user_roles SET role = 'moderator' WHERE user_id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');

-- Crear anime de prueba con slug único
INSERT INTO public.animes (id, name, slug)
VALUES (999, 'Test Anime Fixture', 'test-anime-fixture');

-- -----------------------------------------------------------------------------
-- 2. TEST: Lectura pública del catálogo de animes (Rol: anon)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT is(
    (SELECT name FROM public.animes WHERE id = 999),
    'Test Anime Fixture',
    'El catálogo de animes debe ser de acceso público para lectura'
);

-- -----------------------------------------------------------------------------
-- 3. TEST: Usuario regular no puede insertar animes (Rol: authenticated / User)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
    $$ INSERT INTO public.animes (name, slug) VALUES ('Hacked Anime', 'hacked-anime') $$,
    NULL,
    'Un usuario regular autenticado no puede insertar animes (bloqueado por RLS)'
);

-- -----------------------------------------------------------------------------
-- 4. TEST: Bloqueo de Column-Level Security en INSERT (intento de inyectar claimed_by / views_count)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333'; -- Moderator 1

SELECT throws_ok(
    $$ INSERT INTO public.animes (name, slug, claimed_by, views_count) 
       VALUES ('Anime Malicioso', 'anime-malicioso', '33333333-3333-3333-3333-333333333333', 999999) $$,
    NULL,
    'INSERT directo con claimed_by o views_count debe fallar por Column-Level Security (GRANT)'
);

-- -----------------------------------------------------------------------------
-- 5. TEST: Bloqueo de Column-Level Security en UPDATE sobre claimed_by
-- -----------------------------------------------------------------------------
SELECT throws_ok(
    $$ UPDATE public.animes SET claimed_by = '33333333-3333-3333-3333-333333333333' WHERE id = 999 $$,
    NULL,
    'UPDATE directo sobre la columna claimed_by debe fallar por Column-Level Security (GRANT)'
);

-- -----------------------------------------------------------------------------
-- 6. TEST: Moderator 1 reclama el anime legítimamente con claim_anime()
-- -----------------------------------------------------------------------------
SELECT lives_ok(
    $$ SELECT public.claim_anime(999) $$,
    'Moderator 1 puede reclamar el anime disponible usando public.claim_anime()'
);

SELECT is(
    (SELECT claimed_by FROM public.animes WHERE id = 999),
    '33333333-3333-3333-3333-333333333333'::uuid,
    'El anime debe quedar asignado al UUID del moderador que invocó la función RPC'
);

-- -----------------------------------------------------------------------------
-- 7. TEST: Moderator 2 intenta reclamar un anime ya reclamado
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444444'; -- Moderator 2

SELECT throws_ok(
    $$ SELECT public.claim_anime(999) $$,
    'El anime ya ha sido reclamado por otro moderador o no existe.',
    'claim_anime() debe rechazar reclamos concurrentes de otros moderadores'
);

SELECT * FROM finish();
ROLLBACK;
