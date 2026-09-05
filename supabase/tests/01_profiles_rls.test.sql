-- ==============================================================================
-- PRUEBAS DE SEGURIDAD RLS / RBAC: PROFILES, USER_ROLES Y APP_SETTINGS
-- Archivo: supabase/tests/01_profiles_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(8);

-- -----------------------------------------------------------------------------
-- 1. FIXTURES: Crear usuarios reales y datos de prueba
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_a@totalanime.test', 'encrypted', '{"username": "user_a"}'::jsonb, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_b@totalanime.test', 'encrypted', '{"username": "user_b"}'::jsonb, NOW(), NOW()),
    ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@totalanime.test', 'encrypted', '{"username": "superadmin"}'::jsonb, NOW(), NOW());

-- Establecer rol de administrador para superadmin
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '99999999-9999-9999-9999-999999999999';

-- Insertar configuración inicial
INSERT INTO public.app_settings (key, value, description)
VALUES ('site_config', '{"maintenance": false}'::jsonb, 'Configuración general');

-- -----------------------------------------------------------------------------
-- 2. TEST: Lectura pública de perfiles (Rol: anon)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT is(
    (SELECT username FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111'),
    'user_a',
    'Los perfiles deben ser legibles de forma pública por usuarios anónimos'
);

-- -----------------------------------------------------------------------------
-- 3. TEST: Usuario A modifica su propio perfil (Rol: authenticated / User A)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET bio = 'Mi biografía legítima' WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT is(
    (SELECT bio FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111'),
    'Mi biografía legítima',
    'Un usuario activo puede actualizar su propia biografía'
);

-- -----------------------------------------------------------------------------
-- 4. TEST: Usuario A intenta modificar el perfil de Usuario B (RLS silencioso)
-- -----------------------------------------------------------------------------
UPDATE public.profiles SET bio = 'Hacked Bio' WHERE id = '22222222-2222-2222-2222-222222222222';
SELECT is(
    (SELECT bio FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222'),
    '',
    'RLS debe evitar que Usuario A modifique el perfil de Usuario B (la biografía de B se mantiene inalterada)'
);

-- -----------------------------------------------------------------------------
-- 5. TEST: Usuario A intenta auto-elevarse a admin en user_roles (RLS silencioso)
-- -----------------------------------------------------------------------------
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '11111111-1111-1111-1111-111111111111';
SELECT is(
    (SELECT role::text FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111'),
    'user',
    'RLS debe evitar que un usuario regular modifique su propio rol en user_roles'
);

-- -----------------------------------------------------------------------------
-- 6. TEST: Usuario A no puede modificar app_settings (RLS silencioso)
-- -----------------------------------------------------------------------------
UPDATE public.app_settings SET value = '{"maintenance": true}'::jsonb WHERE key = 'site_config';
SELECT is(
    (SELECT value->>'maintenance' FROM public.app_settings WHERE key = 'site_config'),
    'false',
    'RLS debe evitar que usuarios no administradores modifiquen app_settings'
);

-- -----------------------------------------------------------------------------
-- 7. TEST: Admin SÍ puede modificar roles de usuario (Rol: authenticated / Admin)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999999';

UPDATE public.user_roles SET role = 'moderator' WHERE user_id = '11111111-1111-1111-1111-111111111111';
SELECT is(
    (SELECT role::text FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111'),
    'moderator',
    'Un Administrador autenticado SÍ puede actualizar roles en user_roles'
);

-- -----------------------------------------------------------------------------
-- 8. TEST: Admin SÍ puede modificar app_settings
-- -----------------------------------------------------------------------------
UPDATE public.app_settings SET value = '{"maintenance": true}'::jsonb WHERE key = 'site_config';
SELECT is(
    (SELECT value->>'maintenance' FROM public.app_settings WHERE key = 'site_config'),
    'true',
    'Un Administrador autenticado SÍ puede modificar configuraciones en app_settings'
);

-- -----------------------------------------------------------------------------
-- 9. TEST: Helper is_admin() funciona correctamente
-- -----------------------------------------------------------------------------
SELECT is(
    public.is_admin(),
    true,
    'is_admin() debe retornar true cuando se ejecuta en el contexto del Administrador'
);

SELECT * FROM finish();
ROLLBACK;
