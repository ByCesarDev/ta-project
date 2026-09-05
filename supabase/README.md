# 🗄️ Supabase Infrastructure & Database Configuration - TotalAnime 2.0

Este directorio contiene la arquitectura de base de datos completa, políticas de seguridad **Row Level Security (RLS)**, privilegios **Column-Level Security (CLS)**, buckets de **Supabase Storage** y la suite de pruebas unitarias automatizadas.

---

## 📁 Estructura de Archivos

```
supabase/
├── schema.sql           # DDL: Extensiones, ENUMs, 16 tablas, triggers de usuario y updated_at, índices
├── rls.sql              # RLS: Funciones SECURITY DEFINER y políticas finas para anon, user, mod y admin
├── grants.sql           # Permisos: REVOKE ALL y concesiones explícitas a nivel de tabla y columna (CLS)
├── storage.sql          # Storage: Creación de 4 buckets y políticas de subida/reemplazo/borrado
├── tests/               # Pruebas de seguridad SQL / pgTAP
│   ├── 000_setup.test.sql
│   ├── 01_profiles_rls.test.sql
│   ├── 02_anime_cls_rls.test.sql
│   ├── 03_jobs_views_rls.test.sql
│   └── 04_storage_rls.test.sql
└── README.md            # Guía de ejecución y despliegue
```

---

## 🚀 Orden de Ejecución en Supabase

Si estás configurando una base de datos en **Supabase Cloud (Dashboard -> SQL Editor)** o mediante **Supabase CLI**, ejecuta los scripts estrictamente en el siguiente orden secuencial:

### 1. `schema.sql`
- Habilita las extensiones `uuid-ossp` y `pg_trgm`.
- Crea los 6 tipos ENUM (`user_role`, `user_status`, `episode_status`, `notification_type`, `stream_language`, `job_status`).
- Crea las 16 tablas relacionales con sus índices optimizados.
- Registra el trigger seguro `on_auth_user_created` (con prevención de colisiones de username y asignación obligatoria a rol `user`).
- Activa triggers automáticos de `updated_at`.

### 2. `rls.sql`
- Registra funciones helper y RPC endurecidas con `SECURITY DEFINER SET search_path = ''`:
  - `public.is_active_user()`
  - `public.is_admin()`
  - `public.is_moderator_or_admin()`
  - `public.claim_anime(p_anime_id INT)`
  - `public.record_anime_view(p_anime_id INT)`
- Habilita `ROW LEVEL SECURITY` en las 16 tablas.
- Aplica las políticas restrictivas de acceso.

### 3. `grants.sql`
- Ejecuta `REVOKE ALL` inicial para anular privilegios excesivos por defecto.
- Asigna permisos mínimos de lectura a `anon`.
- Asigna permisos de interacción a `authenticated`.
- Concede permisos de escritura a `authenticated` sobre `user_roles` y `app_settings` (restringidos por RLS a `admin`).
- Aplica **Column-Level Security** en `public.animes` tanto para `INSERT` como para `UPDATE`, impidiendo la manipulación directa de `claimed_by`, `claimed_at` y `views_count`.

### 4. `storage.sql`
- Crea los buckets `posters`, `banners`, `thumbnails` y `avatars`.
- Configura lectura pública y restringe mutaciones a Moderadores/Admins y dueños de carpetas personales.

---

## 🧪 Ejecución de Pruebas Unitarias RLS con Supabase CLI

Para validar que las restricciones de seguridad y aislamiento se apliquen correctamente:

```bash
# Inicializar y resetear la base de datos local
supabase db reset

# Correr la suite de pruebas SQL
supabase test db
```

---

## 🛡️ Matriz de Roles y Capacidades

| Recurso / Acción | Visitante Anónimo (`anon`) | Usuario Activo (`user`) | Moderador (`moderator`) | Administrador (`admin`) | Worker API (Render) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Leer Catálogo (Animes/Episodios)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver Fuentes de Video Activas** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Registrar Vistas (`record_anime_view`)** | ❌ (Anti-Spam) | ❌ (Anti-Spam) | ❌ (Anti-Spam) | ❌ (Anti-Spam) | ✅ (Backend / Secret Key) |
| **Historial / Watchlist Propio** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Actualizar Perfil Propio** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Reclamar Anime (`claim_anime`)** | ❌ | ❌ | ✅ (si está libre) | ✅ (cualquiera) | ✅ |
| **Crear/Editar Animes y Episodios** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Eliminar Animes y Episodios** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Consultar `audit_logs`** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Gestionar Roles de Usuarios** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Gestionar `app_settings`** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Crear/Actualizar `scrape_jobs`** | ❌ | ❌ | ❌ (Solo lectura) | ❌ (Solo lectura) | ✅ (Secret Key) |
