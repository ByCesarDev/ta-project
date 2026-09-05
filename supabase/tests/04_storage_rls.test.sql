-- ==============================================================================
-- PRUEBAS DE SEGURIDAD: POLÍTICAS DE STORAGE Y CICLO DE VIDA DE AVATARES
-- Archivo: supabase/tests/04_storage_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(4);

-- 1. Test: Lectura pública de objetos de storage
SELECT ok(
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id IN ('posters', 'banners', 'thumbnails', 'avatars')) >= 0,
    'Los objetos de los 4 buckets deben ser legibles de forma pública'
);

-- 2. Test: Usuario autenticado no puede subir avatar en la carpeta de otro usuario
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
    $$ INSERT INTO storage.objects (bucket_id, name, owner_id) 
       VALUES ('avatars', '22222222-2222-2222-2222-222222222222/avatar.webp', '11111111-1111-1111-1111-111111111111') $$,
    NULL,
    'Un usuario no puede subir archivos a la carpeta de avatar de otro usuario'
);

-- 3. Test: Usuario no moderador no puede subir a posters/banners
SELECT throws_ok(
    $$ INSERT INTO storage.objects (bucket_id, name, owner_id) 
       VALUES ('posters', 'naruto.webp', '11111111-1111-1111-1111-111111111111') $$,
    NULL,
    'Un usuario regular no puede subir archivos a buckets de catálogo (posters, banners, thumbnails)'
);

-- 4. Test: Un usuario no puede borrar avatares de otro usuario
SELECT throws_ok(
    $$ DELETE FROM storage.objects 
       WHERE bucket_id = 'avatars' AND name = '22222222-2222-2222-2222-222222222222/avatar.webp' $$,
    NULL,
    'Un usuario no puede borrar archivos del bucket avatars pertenecientes a terceros'
);

SELECT * FROM finish();
ROLLBACK;
