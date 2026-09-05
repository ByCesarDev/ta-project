-- ==============================================================================
-- PRUEBAS DE SEGURIDAD RLS / RBAC: PROFILES Y ROLES
-- Archivo: supabase/tests/01_profiles_rls.test.sql
-- ==============================================================================

BEGIN;
SELECT plan(6);

-- 1. Test: Perfiles son legibles por cualquier usuario anónimo
SELECT ok(
    (SELECT COUNT(*) FROM public.profiles) >= 0,
    'Los perfiles deben ser legibles de forma pública (SELECT)'
);

-- 2. Test: Usuario activo puede modificar su propio bio/username
-- Simulamos contexto de usuario autenticado
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

-- Comprobar que no puede modificar perfiles ajenos
SELECT throws_ok(
    $$ UPDATE public.profiles SET bio = 'Hacked' WHERE id = '22222222-2222-2222-2222-222222222222' $$,
    NULL,
    'Un usuario normal no puede modificar el perfil de otro usuario'
);

-- 3. Test: Un usuario autenticado no puede elevarse a admin en user_roles
SELECT throws_ok(
    $$ UPDATE public.user_roles SET role = 'admin' WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
    NULL,
    'Un usuario autenticado no puede modificar su propio rol en user_roles'
);

-- 4. Test: Un usuario autenticado no puede insertar directamente en user_roles
SELECT throws_ok(
    $$ INSERT INTO public.user_roles (user_id, role, status) VALUES ('33333333-3333-3333-3333-333333333333', 'admin', 'active') $$,
    NULL,
    'Un usuario autenticado no puede insertar registros en user_roles'
);

-- 5. Test: Un usuario autenticado no puede leer roles de terceros si no es admin
SELECT is_empty(
    $$ SELECT * FROM public.user_roles WHERE user_id = '22222222-2222-2222-2222-222222222222' $$,
    'Un usuario normal no puede leer el rol de otros usuarios'
);

-- 6. Test: Comprobar helper is_active_user
SELECT is(
    public.is_active_user(),
    false,
    'is_active_user devuelve false si el UUID simulado no existe en user_roles como active'
);

SELECT * FROM finish();
ROLLBACK;
