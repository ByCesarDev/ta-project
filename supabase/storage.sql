-- ==============================================================================
-- TOTALANIME 2.0 - CONFIGURACIÓN Y POLÍTICAS DE SUPABASE STORAGE
-- Archivo: supabase/storage.sql
-- Versión: 2.4.1 Production-Ready
-- Descripción: Creación de buckets públicos para CDN y políticas RLS para
--              gestión de media (posters, banners, thumbnails) y ciclo de vida de avatares.
-- ==============================================================================

-- ========================================================
-- 1. CREACIÓN IDEMPOTENTE DE BUCKETS
-- ========================================================

-- 1.1 Bucket: posters (5MB máx)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posters',
    'posters',
    true,
    5242880, -- 5 MB
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- 1.2 Bucket: banners (8MB máx)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'banners',
    'banners',
    true,
    8388608, -- 8 MB
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- 1.3 Bucket: thumbnails (3MB máx)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    3145728, -- 3 MB
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- 1.4 Bucket: avatars (2MB máx)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- ========================================================
-- 2. POLÍTICAS RLS PARA STORAGE (storage.objects)
-- ========================================================

-- 2.1 Lectura Pública Global para los 4 Buckets
DROP POLICY IF EXISTS "Storage: Public Read" ON storage.objects;
CREATE POLICY "Storage: Public Read" ON storage.objects
    FOR SELECT 
    USING (bucket_id IN ('posters', 'banners', 'thumbnails', 'avatars'));

-- 2.2 Gestión de Media del Catálogo (Posters, Banners, Thumbnails) por Moderadores/Admins
DROP POLICY IF EXISTS "Storage: ModAdmin Catalog Media Manage" ON storage.objects;
CREATE POLICY "Storage: ModAdmin Catalog Media Manage" ON storage.objects
    FOR ALL
    USING (
        bucket_id IN ('posters', 'banners', 'thumbnails') 
        AND (select public.is_moderator_or_admin())
    )
    WITH CHECK (
        bucket_id IN ('posters', 'banners', 'thumbnails') 
        AND (select public.is_moderator_or_admin())
    );

-- 2.3 Ciclo de Vida de Avatares de Usuario: Subida (INSERT)
-- Estructura de ruta requerida: avatars/{user_id}/avatar.webp
DROP POLICY IF EXISTS "Storage: Avatars User Insert" ON storage.objects;
CREATE POLICY "Storage: Avatars User Insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = (select auth.uid())::text
        AND (select public.is_active_user())
    );

-- 2.4 Ciclo de Vida de Avatares de Usuario: Reemplazo (UPDATE)
DROP POLICY IF EXISTS "Storage: Avatars User Update" ON storage.objects;
CREATE POLICY "Storage: Avatars User Update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND (
            (storage.foldername(name))[1] = (select auth.uid())::text 
            OR owner_id = (select auth.uid())::text
        )
        AND (select public.is_active_user())
    )
    WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = (select auth.uid())::text
        AND (select public.is_active_user())
    );

-- 2.5 Ciclo de Vida de Avatares de Usuario: Eliminación (DELETE)
DROP POLICY IF EXISTS "Storage: Avatars User Delete" ON storage.objects;
CREATE POLICY "Storage: Avatars User Delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars' 
        AND (
            (storage.foldername(name))[1] = (select auth.uid())::text 
            OR owner_id = (select auth.uid())::text
        )
        AND (select public.is_active_user())
    );
