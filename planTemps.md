# 📑 Plan Maestro: Sistema de Series, Temporadas y Entregas en TotalAnime

Este documento describe la arquitectura técnica, modelo relacional, API REST, panel de administración, catálogo web y flujo de scraping para estructurar **TotalAnime** en torno a **Series y Temporadas**, manteniendo la correspondencia 1:1 con **AniList** en cada entrega individual.

---

## 🎯 Visión, Decisiones y Reglas Fundamentales

1. **Identidad Principal en la Serie**:
   - En la Web y en el Admin, la entidad visible es la **Serie** (ej. *The Misfit of Demon King Academy* o *Demon Slayer: Kimetsu no Yaiba*).
   - El slug público es limpio y único: `/anime/the-misfit-of-demon-king-academy`.
2. **Selector de Temporadas (Diseño TotalAnime)**:
   - Dentro de cada serie, el usuario y el administrador acceden a un selector desplegable / pestañas con las temporadas, películas o especiales:
     - `Temporada 1 — History's Strongest Demon King... (13 eps)`
     - `Temporada 2 — Parte 1 (12 eps)`
     - `Temporada 2 — Parte 2 (12 eps)`
3. **Ruta Única de Reproducción**:
   - La ruta oficial y exclusiva del reproductor es:
     ```text
     /watch/{seriesSlug}/{episodeId}
     ```
   - No se utiliza `episodeNumber` en la ruta para evitar colisiones entre episodios #1 de distintas temporadas.
4. **Preservación Total de Entregas y AniList**:
   - Cada entrega individual conserva su registro en `animes` (`anilist_id`, fechas de emisión semanal, sinopsis específica, estado y portada de temporada).
   - Los episodios (`episodes`), servidores (`episode_sources`), progreso de usuario (`user_history`) y fuentes se conservan intactos.
5. **Mapeo Oficial de Scraping (`anime_source_bindings`)**:
   - La tabla `anime_source_bindings` es la única fuente de verdad para el mapeo entre entregas locales y fuentes de video (incluyendo `source_season_id`, `audio_variants_config` y `episode_offset_map`).
   - Cada trabajo de scraping (`scrape_jobs`) guarda un snapshot inmutable de la configuración utilizada.
6. **Integridad Referencial y Anti-Huérfanos**:
   - Ninguna ficha de `animes` puede quedar huérfana. Al desvincular una entrega de una temporada, el sistema exige moverla a otra temporada o promoverla a una serie independiente.
   - `ON DELETE RESTRICT`: No se puede eliminar una serie con temporadas, ni una temporada con entregas vinculadas.
7. **Combinación Transaccional de Series**:
   - La fusión de dos series se ejecuta en una transacción atómica que transfiere temporadas, actualiza favoritos deduplicando, registra alias en `series_slug_redirects` y oculta/elimina la serie absorbida evitando ciclos.
8. **Permisos y Seguridad**:
   - Se respetan las políticas de moderación actuales: los moderadores solo gestionan series/entregas reclamadas (`claimed_by`). Solo los administradores pueden fusionar, reasignar libremente o eliminar series.

---

## 🏗️ 1. Modelo de Datos (PostgreSQL / Supabase)

### Diagrama Entidad-Relación

```mermaid
erDiagram
    series ||--o{ series_seasons : "tiene (1:N)"
    series_seasons ||--o{ series_entries : "agrupa (1:N)"
    animes ||--|| series_entries : "vinculado_a (1:1)"
    animes ||--o{ episodes : "contiene (1:N)"
    episodes ||--o{ episode_sources : "tiene (1:N)"
    animes ||--o| anime_source_bindings : "configuracion_scraping"
    series ||--o{ series_slug_redirects : "alias_historicos"

    series {
        bigint id PK
        text name "Título principal de la serie"
        text slug UK "Slug único limpio"
        text description "Sinopsis general editable"
        text cover_image "Póster principal"
        text banner_image "Banner principal"
        timestamp created_at
        timestamp updated_at
    }

    series_seasons {
        bigint id PK
        bigint series_id FK "ON DELETE RESTRICT"
        int season_number "Número de temporada opcional"
        text name "Nombre o subtítulo visible"
        text kind "season | movie | special | ova"
        int display_order "Orden en el selector"
        timestamp created_at
        timestamp updated_at
    }

    series_entries {
        bigint id PK
        bigint season_id FK "ON DELETE RESTRICT"
        bigint anime_id FK,UK "1 anime = 1 temporada (ON DELETE RESTRICT)"
        int display_order "Orden dentro de la temporada"
        text part_label "Parte 1, Parte 2, etc."
        timestamp created_at
    }

    anime_source_bindings {
        bigint id PK
        bigint anime_id FK,UK "ON DELETE CASCADE"
        text provider "dramasfree | cluster | etc."
        text source_url "URL o identificador de la fuente"
        text source_season_id "ID de temporada en la fuente si aplica"
        jsonb audio_variants_config "Variantes de audio configuradas"
        jsonb episode_offset_map "Mapeo explícito fuente -> local"
        timestamp created_at
        timestamp updated_at
    }

    series_slug_redirects {
        text old_slug PK
        bigint target_series_id FK
        bigint target_season_id F## 📋 Checklist de Implementación (Completado)

### 🔹 Fase 1: Modelo de Datos y Migración SQL
- [x] Crear migración `20261008000006_clean_series_and_seasons_architecture.sql`.
- [x] Definir tabla `series` con índices únicos en `slug`.
- [x] Definir tabla `series_seasons` con constraint foránea `series_id` (`ON DELETE RESTRICT`).
- [x] Definir tabla `series_entries` con constraint foránea `season_id` y `anime_id` (`UNIQUE(anime_id)`, `ON DELETE RESTRICT`).
- [x] Definir tabla `anime_source_bindings` para configuración de fuentes y mapeos de temporadas.
- [x] Definir tabla `series_slug_redirects` con prevención de ciclos y soporte para futuros alias y combinaciones de series.
- [x] Definir tabla `user_favorites` a nivel de serie con deduplicación por usuario.
- [x] Añadir columna snapshot `scrape_jobs.source_config`.
- [x] Actualizar esquema de referencia `supabase/schema.sql`.
- [x] Sincronizar tipos de TypeScript en `api/src/types`, `admin/src/types` y `web/src/types`.

### 🔹 Fase 2: Endpoints de API y Servicios Backend
- [x] Crear `series.service.ts` y `series.controller.ts`:
  - [x] `GET /api/v1/series`: Listado paginado con agregación de géneros (unión), estados calculados (`emision`, `finalizado`, `proximamente`), temporadas y episodios.
  - [x] `GET /api/v1/series/:slug`: Detalle completo con temporadas y entregas ordenadas por `display_order`.
  - [x] `POST /api/v1/series`: Crear serie (Admin / Mod).
  - [x] `PUT /api/v1/series/:id`: Editar metadatos de serie con preservación de slug histórico.
  - [x] `DELETE /api/v1/series/:id`: Eliminación con validación `ON DELETE RESTRICT` (rechazar si tiene temporadas).
  - [x] `POST /api/v1/series/:seriesId/seasons`: Crear temporada.
  - [x] `PUT /api/v1/series/seasons/:seasonId`: Editar temporada y actualizar orden.
  - [x] `DELETE /api/v1/series/seasons/:seasonId`: Rechazar si tiene entregas vinculadas.
  - [x] `POST /api/v1/series/seasons/:seasonId/entries`: Vincular entrega (`anime_id`).
  - [x] `POST /api/v1/series/entries/:entryId/reassign`: Reasignar entrega a otra temporada o etiquetar parte.
  - [x] `POST /api/v1/series/entries/:entryId/promote`: Promover entrega a nueva serie independiente (regla anti-huérfanos).
  - [x] `POST /api/v1/series/combine`: Fusión transaccional de dos series con migración de temporadas, favoritos y registro de alias.
- [x] Actualizar `anilist.service.ts` para consultar `relations` (`SEQUEL`, `PREQUEL`, `PARENT`, `SIDE_STORY`) de AniList GraphQL.
- [x] Registrar rutas en `api/src/routes/series.routes.ts` y `api/src/routes/index.ts`.

### 🔹 Fase 3: Scraping Inteligente por Temporada y Snapshot Inmutable
- [x] Persistir configuración en `anime_source_bindings` (`source_url`, `source_season_id`, `audio_variants_config`, `episode_offset_map`).
- [x] Guardar snapshot inmutable en `scrape_jobs.source_config` al encolar el trabajo (`jobs.service.ts` / `jobs.controller.ts`).
- [x] Adaptar `scrapeWorker.ts` para leer del snapshot inmutable y soportar `episode_offset_map` y variantes multi-audio descubiertas.
- [x] Importar automáticamente todos los audios, subtítulos y calidades verificadas por HLS.

### 🔹 Fase 4: Panel de Administración (Admin UI)
- [x] Crear vista unificada de **Series y Catálogo** en `admin/src/pages/AnimesPage.tsx`.
- [x] Crear modal de gestión de temporadas y entregas `admin/src/components/series/SeriesSeasonsModal.tsx`:
  - [x] Listado de temporadas con selector de orden (`display_order`), tipo (`season`, `movie`, `special`, `ova`) y número.
  - [x] Lista de entregas vinculadas con etiquetas de parte (*Parte 1*, *Parte 2*).
  - [x] Acciones para reasignar entrega, gestionar episodios, scrapear o convertir en serie independiente.
- [x] Actualizar modal de importación de AniList `admin/src/components/animes/AniListImportModal.tsx`:
  - [x] Opciones: **"Crear como Nueva Serie"** o **"Añadir a Serie Existente"** (crear temporada o elegir existente, asignar etiqueta de parte).
  - [x] Creación transaccional de entrega y vínculo en un solo paso (`POST /api/v1/series/import-anilist`).
  - [x] Sugerencias de `relations` de AniList.
- [x] Crear modal de fusión de series `admin/src/components/series/CombineSeriesModal.tsx`.
- [x] Crear modal de creación/edición de series `admin/src/components/series/SeriesFormModal.tsx`.

### 🔹 Fase 5: Catálogo Web y Búsqueda
- [x] Actualizar catálogo web `web/src/pages/CatalogPage.tsx`:
  - [x] Mostrar 1 tarjeta por serie con badge de temporadas y episodios totales.
  - [x] Filtros por género, estado, formato y ordenamiento.
- [x] Crear hook `useSeries.ts` con `useSeriesCatalog`, `useSeriesDetail`, `useWatchEpisode`.
- [x] Adaptar tarjeta `AnimeCard.tsx` para badges de series y temporadas.

### 🔹 Fase 6: Ficha de Serie y Selector de Temporadas en Web
- [x] Actualizar `web/src/pages/AnimeDetailPage.tsx`:
  - [x] Título principal limpio de la serie.
  - [x] Selector de temporadas desplegable (Crunchyroll-style) y pestañas rápidas con conteo de episodios.
  - [x] Al cambiar de temporada, actualiza parámetro URL `?season=[seasonId]` y recarga episodios de la temporada activa.
  - [x] Soporta entregas divididas (Parte 1 y Parte 2) dentro de una misma temporada visual.
  - [x] Botón "Empezar a Ver" enlaza al primer episodio de la temporada activa.

### 🔹 Fase 7: Reproductor Web y Rutas de Video
- [x] Configurar ruta única de reproducción: `/watch/:slug/:episodeId`.
- [x] Header del reproductor: Título de la Serie + Temporada activa + Número de Episodio.
- [x] Dropdown de cambio rápido de episodio con contexto de temporada.
- [x] Navegación Anterior / Siguiente entre episodios y avance inter-temporadas.
- [x] Selector de pistas de audio multi-idioma y reproductor HLS verified.

### 🔹 Fase 8: Pruebas, Verificación y Build
- [x] Pruebas unitarias en `api/tests/series.test.ts` (70 tests pasando).
- [x] Compilación TypeScript limpia (`0 errores`) en `api`, `admin` y `web`.
- [x] Dev servers activos y sincronizados.
