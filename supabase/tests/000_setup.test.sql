-- ==============================================================================
-- TOTALANIME 2.0 - SETUP INICIAL PARA SUITE DE PRUEBAS PGTAP
-- Archivo: supabase/tests/000_setup.test.sql
-- Descripción: Habilita la extensión pgtap en el esquema extensions.
-- ==============================================================================

BEGIN;
SELECT plan(1);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT ok(
    EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgtap'),
    'La extensión pgtap debe estar habilitada para la ejecución de pruebas'
);

SELECT * FROM finish();
ROLLBACK;
