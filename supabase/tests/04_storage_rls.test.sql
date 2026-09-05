-- ==============================================================================
-- PRUEBAS DE SEGURIDAD: SUPABASE STORAGE, ISOLATION Y CICLO DE VIDA DE AVATARES
-- Archivo: supabase/tests/04_storage_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(6);

-- -----------------------------------------------------------------------------
-- 1. FIXTURES: Crear usuarios y objetos de almacenamiento
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_a@totalanime.test', 'encrypted', '{"username": "user_a"}'::jsonb, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_b@totalanime.test', 'encrypted', '{"username": "user_b"}'::jsonb, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mod@totalanime.test', 'encrypted', '{"username": "mod_user"}'::jsonb, NOW(), NOW());

UPDATE public.user_roles SET role = 'moderator' WHERE user_id = '33333333-3333-3333-3333-333333333333';

-- Crear objetos iniciales
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
VALUES 
    ('avatars', '11111111-1111-1111-1111-111111111111/avatar.webp', '11111111-1111-1111-1111-111111111111', '{"custom": "user_a"}'::jsonb),
    ('avatars', '22222222-2222-2222-2222-222222222222/avatar.webp', '22222222-2222-2222-2222-222222222222', '{"custom": "user_b"}'::jsonb),
    ('posters', 'naruto.webp', '33333333-3333-3333-3333-333333333333', '{}'::jsonb);

-- -----------------------------------------------------------------------------
-- 2. TEST: Lectura pública de objetos en buckets (Rol: anon)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;

SELECT is(
    (SELECT COUNT(*)::int FROM storage.objects WHERE bucket_id IN ('avatars', 'posters')),
    3,
    'Los objetos de los buckets públicos deben ser legibles de forma global'
);

-- -----------------------------------------------------------------------------
-- 3. TEST: Usuario A puede subir archivos dentro de su propia carpeta de avatar
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT lives_ok(
    $$ INSERT INTO storage.objects (bucket_id, name, owner_id) 
       VALUES ('avatars', '11111111-1111-1111-1111-111111111111/avatar_new.webp', '11111111-1111-1111-1111-111111111111') $$,
    'Un usuario activo puede subir archivos a su propia subcarpeta en avatars'
);

-- -----------------------------------------------------------------------------
-- 4. TEST: Usuario A NO puede subir archivos a la carpeta de avatar de Usuario B
-- -----------------------------------------------------------------------------
SELECT throws_ok(
    $$ INSERT INTO storage.objects (bucket_id, name, owner_id) 
       VALUES ('avatars', '22222222-2222-2222-2222-222222222222/hacked.webp', '11111111-1111-1111-1111-111111111111') $$,
    NULL,
    'RLS debe impedir que un usuario inserte archivos en la carpeta de otro usuario'
);

-- -----------------------------------------------------------------------------
-- 5. TEST: Usuario A intenta modificar el avatar de Usuario B (RLS silencioso UPDATE 0)
-- -----------------------------------------------------------------------------
UPDATE storage.objects 
SET metadata = '{"custom": "hacked"}'::jsonb
WHERE bucket_id = 'avatars' AND name = '22222222-2222-2222-2222-222222222222/avatar.webp';

SELECT is(
    (SELECT metadata->>'custom' FROM storage.objects WHERE bucket_id = 'avatars' AND name = '22222222-2222-2222-2222-222222222222/avatar.webp'),
    'user_b',
    'RLS evita la modificación no autorizada: los metadatos del avatar del Usuario B se mantienen intactos'
);

-- -----------------------------------------------------------------------------
-- 6. TEST: Moderador SÍ puede subir posters de animes
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333';

SELECT lives_ok(
    $$ INSERT INTO storage.objects (bucket_id, name, owner_id) 
       VALUES ('posters', 'bleach.webp', '33333333-3333-3333-3333-333333333333') $$,
    'Moderadores autenticados pueden subir contenido a buckets de catálogo'
);

-- -----------------------------------------------------------------------------
-- 7. TEST: Usuario regular NO puede subir posters de animes
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
    $$ INSERT INTO storage.objects (bucket_id, name, owner_id) 
       VALUES ('posters', 'malicious.webp', '11111111-1111-1111-1111-111111111111') $$,
    NULL,
    'RLS impide que usuarios regulares suban archivos a posters/banners/thumbnails'
);

SELECT * FROM finish();
ROLLBACK;
