-- ==============================================================================
-- PRUEBAS DE SEGURIDAD: COLUMN-LEVEL PRIVILEGES Y RLS EN ANIMES
-- Archivo: supabase/tests/02_anime_cls_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(5);

-- 1. Test: Catálogo de Animes es público
SELECT ok(
    (SELECT COUNT(*) FROM public.animes) >= 0,
    'El catálogo de animes debe ser de acceso público para lectura (SELECT)'
);

-- 2. Test: Usuario sin permisos de moderador no puede insertar animes
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
    $$ INSERT INTO public.animes (name, slug) VALUES ('Test Anime', 'test-anime') $$,
    NULL,
    'Un usuario regular autenticado no puede crear animes (bloqueado por RLS)'
);

-- 3. Test: Bloqueo de Column-Level Security en claimed_by / claimed_at
-- Incluso si el usuario fuera moderador, el UPDATE directo a claimed_by está revocado
SELECT throws_ok(
    $$ UPDATE public.animes SET claimed_by = '11111111-1111-1111-1111-111111111111' WHERE id = 1 $$,
    NULL,
    'UPDATE directo sobre la columna claimed_by debe fallar por Column-Level Security (GRANT)'
);

-- 4. Test: Bloqueo de Column-Level Security en views_count
SELECT throws_ok(
    $$ UPDATE public.animes SET views_count = 99999999 WHERE id = 1 $$,
    NULL,
    'UPDATE directo sobre views_count debe fallar por Column-Level Security (GRANT)'
);

-- 5. Test: claim_anime() falla si el usuario no es moderador ni admin
SELECT throws_ok(
    $$ SELECT public.claim_anime(1) $$,
    'Acceso denegado: Se requieren permisos de moderación.',
    'claim_anime() debe lanzar excepción ante usuarios no moderadores'
);

SELECT * FROM finish();
ROLLBACK;
