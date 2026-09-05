-- ==============================================================================
-- TOTALANIME 2.0 - SETUP INICIAL PARA SUITE DE PRUEBAS PGTAP
-- Archivo: supabase/tests/000_setup.test.sql
-- Descripción: Habilita la extensión pgtap en el esquema extensions.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
