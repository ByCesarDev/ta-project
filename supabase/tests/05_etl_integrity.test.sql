-- ==============================================================================
-- TOTALANIME 2.0 - TEST SUITE 05: ETL DATA MIGRATION INTEGRITY & TRACEABILITY
-- Archivo: supabase/tests/05_etl_integrity.test.sql
-- Propósito: Garantizar completitud (484 eps, 17+5 history, 3+3 watchlist),
--            recencia MIN/MAX de reproducción, inmutabilidad de staging y 0 huérfanos.
-- ==============================================================================

BEGIN;
SELECT plan(29);

-- 1. Catálogo Base: Géneros (19) y Avatares (13)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.genres',
    ARRAY[19],
    'ETL: Debe haber exactamente 19 géneros migrados'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.avatars',
    ARRAY[13],
    'ETL: Debe haber exactamente 13 avatares migrados'
);

-- 2. Catálogo de Animes (17 animes, IDs 66 a 82)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.animes',
    ARRAY[17],
    'ETL: Debe haber exactamente 17 animes en el catálogo inicial'
);

SELECT results_eq(
    'SELECT min(id)::integer, max(id)::integer FROM public.animes',
    'VALUES (66, 82)',
    'ETL: El rango de IDs de anime debe ser de 66 a 82'
);

-- 3. Catálogo de Episodios: 484 episodios completos (IDs 2038 a 2521)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.episodes',
    ARRAY[484],
    'ETL: Debe haber exactamente 484 episodios migrados (cero pérdida)'
);

SELECT results_eq(
    'SELECT min(id)::integer, max(id)::integer FROM public.episodes',
    'VALUES (2038, 2521)',
    'ETL: El rango de IDs de episodios debe ser exactamente 2038 a 2521'
);

-- 4. Fuentes de Video Legacy (6 fuentes activas)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.episode_sources',
    ARRAY[6],
    'ETL: Debe haber exactamente 6 fuentes de video legacy migradas'
);

-- 5. Usuarios Legacy y Mapa de Migración (INT -> UUID)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.migration_user_map',
    ARRAY[3],
    'ETL: Debe haber exactamente 3 usuarios en migration_user_map (2, 4, 5)'
);

SELECT results_eq(
    'SELECT legacy_id FROM public.migration_user_map ORDER BY legacy_id',
    'VALUES (2), (4), (5)',
    'ETL: Los IDs legacy mapeados deben ser 2, 4 y 5'
);

-- 6. Estado de Episodios Vistos (8 registros para episodios 2089-2096)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.user_episode_status',
    ARRAY[8],
    'ETL: Debe haber exactamente 8 registros en user_episode_status'
);

-- 7. Watchlist: 6 elementos en total (3 resueltos + 3 en staging unresolved con legacy_id)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.watch_later',
    ARRAY[3],
    'ETL: Debe haber 3 watchlist resueltos en public.watch_later (Death Note, Demon Slayer, Tougen Anki)'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.unresolved_watch_later',
    ARRAY[3],
    'ETL: Debe haber 3 watchlist no resueltos en staging (Bunny Girl, Re:ZERO, Naruto)'
);

SELECT results_eq(
    'SELECT legacy_id FROM public.unresolved_watch_later ORDER BY legacy_id',
    'VALUES (11), (12), (14)',
    'ETL: Los legacy_ids de unresolved_watch_later deben ser exactamente 11, 12 y 14'
);

SELECT results_eq(
    'SELECT (SELECT count(*) FROM public.watch_later) + (SELECT count(*) FROM public.unresolved_watch_later)::bigint',
    ARRAY[6::bigint],
    'ETL: Total watchlist preservado debe ser exactamente 6'
);

-- 8. Historial: 17 Resueltos + 5 Staging con Recencia MIN/MAX
SELECT results_eq(
    'SELECT count(*)::integer FROM public.user_history',
    ARRAY[17],
    'ETL: public.user_history debe contener exactamente 17 estados únicos normalizados'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.unresolved_legacy_history',
    ARRAY[5],
    'ETL: public.unresolved_legacy_history debe contener exactamente 5 registros staging'
);

SELECT results_eq(
    'SELECT legacy_id FROM public.unresolved_legacy_history ORDER BY legacy_id',
    'VALUES (3), (145), (148), (151), (192)',
    'ETL: Los legacy_ids de unresolved_legacy_history deben ser exactamente 3, 145, 148, 151 y 192'
);

SELECT results_eq(
    'SELECT (SELECT count(*) FROM public.user_history) + (SELECT count(*) FROM public.unresolved_legacy_history)::bigint',
    ARRAY[22::bigint],
    'ETL: Total estados de historial (resueltos + no resueltos) debe ser exactamente 22'
);

-- Verificación de Recencia MIN(created_at) y MAX(updated_at)
SELECT results_eq(
    $$SELECT created_at, updated_at FROM public.user_history WHERE user_id = (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2) AND episode_id = 2096$$,
    $$VALUES ('2025-09-04 01:56:57+00'::timestamptz, '2025-09-26 17:21:37+00'::timestamptz)$$,
    'ETL Recencia: TOUGEN ANKI Ep 8 debe conservar primera vista (Sep 4) y última reproducción (Sep 26)'
);

SELECT results_eq(
    $$SELECT created_at, updated_at FROM public.user_history WHERE user_id = (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2) AND episode_id = 2384$$,
    $$VALUES ('2025-08-27 13:53:52+00'::timestamptz, '2025-08-31 00:54:53+00'::timestamptz)$$,
    'ETL Recencia: Seven Deadly Sins Ep 1 debe conservar primera vista (Aug 27) y última reproducción (Aug 31)'
);

-- 9. Integridad de Métricas de Pageview
SELECT results_eq(
    'SELECT views FROM public.episodes WHERE id = 2089',
    ARRAY[8],
    'ETL: Episodio 2089 debe tener exactamente 8 views históricas'
);

SELECT results_eq(
    'SELECT views FROM public.episodes WHERE id = 2347',
    ARRAY[8],
    'ETL: Episodio 2347 debe tener exactamente 8 views históricas'
);

-- 10. Seguridad: Clientes NO pueden insertar en tablas Staging
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000005';

SELECT throws_ok(
    $$INSERT INTO public.unresolved_legacy_history (legacy_id, user_id, legacy_anime_id, anime_title, anime_ep, anime_image) VALUES (9999, 'a0000000-0000-0000-0000-000000000005', 'fake', 'Fake', '1', 'fake.jpg')$$,
    '42501',
    NULL,
    'Seguridad: Cliente authenticated no puede insertar datos en unresolved_legacy_history'
);

SELECT throws_ok(
    $$INSERT INTO public.unresolved_watch_later (legacy_id, user_id, name, legacy_slug, image) VALUES (9999, 'a0000000-0000-0000-0000-000000000005', 'Fake', 'fake', 'fake.jpg')$$,
    '42501',
    NULL,
    'Seguridad: Cliente authenticated no puede insertar datos en unresolved_watch_later'
);

-- Restaurar rol de postgres para verificaciones de integridad
SET LOCAL ROLE postgres;

-- 11. Verificación de CERO Huérfanos (Orphan Checks)
SELECT results_eq(
    'SELECT count(*)::integer FROM public.episodes WHERE anime_id NOT IN (SELECT id FROM public.animes)',
    ARRAY[0],
    'ETL Integridad: 0 episodios huérfanos'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.episode_sources WHERE episode_id NOT IN (SELECT id FROM public.episodes)',
    ARRAY[0],
    'ETL Integridad: 0 fuentes de video huérfanas'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.anime_genres WHERE anime_id NOT IN (SELECT id FROM public.animes) OR genre_id NOT IN (SELECT id FROM public.genres)',
    ARRAY[0],
    'ETL Integridad: 0 relaciones anime_genres huérfanas'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.user_history WHERE user_id NOT IN (SELECT id FROM public.profiles) OR episode_id NOT IN (SELECT id FROM public.episodes)',
    ARRAY[0],
    'ETL Integridad: 0 registros de historial huérfanos'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.watch_later WHERE user_id NOT IN (SELECT id FROM public.profiles) OR anime_id NOT IN (SELECT id FROM public.animes)',
    ARRAY[0],
    'ETL Integridad: 0 registros de watchlist huérfanos'
);

SELECT * FROM finish();
ROLLBACK;
