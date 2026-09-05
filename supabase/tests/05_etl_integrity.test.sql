-- ==============================================================================
-- TOTALANIME 2.0 - TEST SUITE 05: ETL DATA MIGRATION INTEGRITY
-- Archivo: supabase/tests/05_etl_integrity.test.sql
-- Propósito: Garantizar la completitud y 0 pérdida de datos del dump legacy (484 eps, 3 users, 6 watchlist, historial)
-- ==============================================================================

BEGIN;
SELECT plan(22);

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

-- 5. Usuarios Legacy y Mapa de Migración
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

-- 7. Watchlist: 6 elementos en total (3 resueltos + 3 en staging unresolved)
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
    'SELECT (SELECT count(*) FROM public.watch_later) + (SELECT count(*) FROM public.unresolved_watch_later)::bigint',
    ARRAY[6::bigint],
    'ETL: Total watchlist preservado debe ser exactamente 6'
);

-- 8. Historial: Resuelto + Staging no resuelto
SELECT ok(
    (SELECT count(*) FROM public.user_history) > 0,
    'ETL: public.user_history debe contener registros de reproducción resueltos'
);

SELECT results_eq(
    'SELECT count(*)::integer FROM public.unresolved_legacy_history',
    ARRAY[5],
    'ETL: public.unresolved_legacy_history debe contener exactamente 5 registros staging de animes fuera de catálogo'
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

-- 10. Verificación de CERO Huérfanos (Orphan Checks)
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
