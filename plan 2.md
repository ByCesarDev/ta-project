# Plan de Arquitectura e Implementación: Sistema de Scraping Preciso y Multi-Audio

Este documento define la arquitectura integral, el modelo de datos, la lógica del scraper y la interfaz de usuario para el sistema de importación, sincronización y reproducción multi-audio de **TotalAnime**.

---

## 🎯 Objetivos Principales

1. **Precisión Total con Enlace Explícito**: Usar directamente la URL o hash del anime en Seekee/Cluster para evitar ambigüedades, búsquedas difusas o cruces erróneos entre temporadas.
2. **Importación Exhaustiva y Automática**: Extraer todas las versiones de audio (`dubbingList`), resoluciones HLS y pistas de subtítulos WebVTT disponibles sin requerir selección manual en el modal.
3. **Identidad de Audio Estable y Libre de Colisiones**: Guardar `audio_variant` como identificador de la ficha de esa versión, separando `audio_language` (ej. `ja`, `es-419`, `es-ES`, `en-US`) y `language_label` (ej. `"Español Latino"`).
4. **Validación Real de Reproducción**: Comprobar lectura de manifiesto `.m3u8`, resolución de playlist hija y fragmento de video antes de declarar un episodio disponible.
5. **Preservación ante Fallos Parciales**: Si falla una variante de audio o un capítulo, conservar las fuentes previas que ya funcionen y reportar estado `partial`.
6. **Reproductor con Idiomas Reales**: El reproductor (`TotalAnimePlayer`) reconoce y permite alternar entre todos los doblajes e idiomas reales importados.
7. **Recuperación y Re-scrapear Global**: Memorizar las fuentes en cada anime para relanzar actualizaciones masivas con 1 clic en caso de caída de espejos o caducidad de tokens.

---

## 🏗️ Fases de Ejecución

```mermaid
flowchart TD
    subgraph Fase 1: Modelo de Datos & Migración
        M1[Migración SQL segura y retrocompatible]
        M2[Campos: audio_variant, audio_language, language_label, source_key]
        M3[Actualización de tipos TS en API, Admin y Web]
    end

    subgraph Fase 2: Proveedor Multi-Audio
        P1[previewSource: Inspección y análisis previo]
        P2[Extracción exhaustiva de todas las variantes de dubbingList]
        P3[Subtítulos estrictos y confirmados por identidad de episodio]
    end

    subgraph Fase 3: API & Worker Resiliente
        W1[Jobs API con congelación de configuración y soporte partial]
        W2[Worker: Creación de episodios reales según alcance]
        W3[Validación HLS de segmento real]
        W4[Preservación de fuentes previas ante fallos parciales]
    end

    subgraph Fase 4: Admin Modal & UI
        A1[ScrapeAnimeModal con Live Preview y desglose por versión]
        A2[Soporte para alcance: Todos, Específico, Pendientes por variante]
        A3[Acciones rápidas por episodio en EpisodesPage]
    end

    subgraph Fase 5: Reproductor Web Multi-Idioma
        R1[TotalAnimePlayer con selector de pistas de audio reales]
        R2[Sincronización de calidad y subtítulos por variante de audio]
    end

    subgraph Fase 6: Re-scraping Global & Resiliencia
        G1[Job Masivo: Re-scrape global por lotes usando fuentes memorizadas]
    end

    Fase 1 --> Fase 2 --> Fase 3 --> Fase 4 --> Fase 5 --> Fase 6
```

---

## 🗄️ Fase 1: Modelo de Datos y Migración de Base de Datos

### 1.1 Tabla `public.animes`

- `source_url` (`TEXT`, nullable): URL o parámetro base memorizado.
- `source_id` (`VARCHAR(100)`, nullable): Identificador de la ficha en la fuente.
- `source_type` (`VARCHAR(50)`, default `'cluster'`): Proveedor origen.
- `discovered_variants` (`JSONB`, default `'[]'`): Metadatos de las versiones de audio encontradas (`[{ variant_id, name, audio_language, category }]`).

### 1.2 Tabla `public.episodes`

- `source_episode_id` (`VARCHAR(100)`, nullable): ID del episodio en la fuente para verificar correspondencia exacta.
- `episode_number` (`NUMERIC(6,1)` o compatible para admitir especiales como `12.5`).

### 1.3 Tabla `public.episode_sources`

- `audio_variant` (`VARCHAR(80)`, default `'default'` NOT NULL): Identificador único y estable de la variante/versión de audio (ej. hash de la ficha de ese doblaje o `original`).
- `audio_language` (`VARCHAR(20)`, default `'und'` NOT NULL): Código de idioma normalizado (`ja`, `es-419`, `es-ES`, `en`, `pt-BR`, `und`).
- `language_label` (`VARCHAR(100)`, nullable): Etiqueta legible (`"Japonés (Original)"`, `"Español Latino"`, `"Español (España)"`, `"Inglés"`).
- `source_key` (`VARCHAR(100)`, default `'default'` NOT NULL): Clave para distinguir servidores independientes con misma calidad.
- `subtitles` (`JSONB`, default `'[]'`): Pistas WebVTT confirmadas para este episodio y versión.
- **Restricción Única Segura**:
  ```sql
  CONSTRAINT uq_episode_source_v2 UNIQUE (episode_id, provider, audio_variant, source_key, quality)
  ```

### 1.4 Tabla `public.scrape_jobs`

- `source_url` (`TEXT`, nullable): URL o hash específico congelado para la ejecución.
- `source_id` (`VARCHAR(100)`, nullable): ID de ficha congelado.
- `frozen_config` (`JSONB`, default `'{}'`): Variantes de audio y rutas resueltas al encolar el trabajo.
- `target_mode` (`VARCHAR(30)`, default `'all'`): `'all'` | `'single'` | `'pending'`.
- `target_episode_number` (`NUMERIC(6,1)`, nullable): Episodio específico.
- `status` (`job_status` ampliado o VARCHAR): `'pending'` | `'processing'` | `'completed'` | `'partial'` | `'failed'`.

---

## 🌐 Fase 2: Proveedor Multi-Audio & Extractor Seguro (`dramasfree.provider.ts`)

### 2.1 Método `previewSource(sourceUrlOrParam)`

- Consulta el encabezado y `__NEXT_DATA__` sin descargar fragmentos.
- Extrae:
  - Título y carátula oficial de la fuente.
  - Lista exacta de episodios publicados (array de números reales, ej: `[1, 2, 3, 4, 5]`).
  - Lista completa de variantes de `dubbingList` con `{ variant_id, name, audio_language, websiteParam }`.
  - Disponibilidad de episodios por variante.

### 2.2 Extracción Exhaustiva

- Itera la versión base y **todas** las variantes de `dubbingList`.
- Para cada variante, obtiene `mediaInfoList` y construye las fuentes con su `audio_variant`, `audio_language`, `language_label`, `quality` normalizada y `source_key`.

### 2.3 Subtítulos Confirmados

- Extrae subtítulos asociados estrictamente al `episodeNumber` (en `episodeVo` correspondiente o en metadata de página cuya identidad de episodio esté confirmada).
- No realiza fallback al episodio 0.

---

## ⚙️ Fase 3: API & Worker con Validación de Reproducción

### 3.1 Endpoints en `jobs.controller.ts` / `stream.controller.ts`

- `POST /api/v1/jobs/preview-source`: Inspecciona y devuelve el resumen para el modal.
- `POST /api/v1/jobs/scrape`: Encola el trabajo congelando la fuente y variantes.
- `POST /api/v1/jobs/bulk-rescrape`: Encola tareas masivas para animes con fuentes guardadas.

### 3.2 ScrapeWorker (`scrapeWorker.ts`)

1. **Creación de Episodios Reales**: Inserta en `episodes` los episodios realmente publicados en la fuente dentro del alcance (`all`, `single` o `pending`).
2. **Validación HLS de Segmento**:
   - Descarga los primeros bytes del `.m3u8` master.
   - Resuelve una playlist hija si es adaptable.
   - Hace una petición de rango a un fragmento `.ts`/`.m4s` verificando bytes válidos.
3. **Preservación y Estado Partial**:
   - Las fuentes válidas se actualizan mediante upsert con `uq_episode_source_v2`.
   - Si una variante falla o un capítulo falla, se preservan las fuentes anteriores y el job se marca como `partial`.

---

## 🖥️ Fase 4: Modal de Scraping en Admin Panel (`admin`)

### 4.1 Componente `ScrapeAnimeModal.tsx`

- **Input de Enlace**: Con debouncing automático para invocar `/preview-source`.
- **Resumen Visual**:
  - Título y temporada detectada en la fuente vs. TotalAnime.
  - Insignias de todas las variantes de audio detectadas.
  - Episodios publicados en la fuente.
- **Alcance de Episodios**:
  - `Todos los episodios publicados` (por defecto en finalizados).
  - `Episodio específico` con selector numérico (por defecto en emisión).
  - `Episodios pendientes por variante` (para completar audios faltantes).
- **Acción**: «Iniciar scraping» (importación automática de todas las calidades, audios y subtítulos).

---

## 🎬 Fase 5: Reproductor Web Multi-Idioma (`web`)

### 5.1 `TotalAnimePlayer.tsx` & `WatchPage.tsx`

- Menú de **Pistas de Audio** mostrando los idiomas reales (`Japonés (Original)`, `Español Latino`, `Español España`, `Inglés`, etc.) derivados de `audio_variant` / `language_label`.
- Cambio de audio fluido conservando el tiempo de reproducción actual (`currentTime`).
- Calidades ordenadas limpiamente (`Auto`, `1080p`, `720p`, `540p`, `480p`, `360p`).

---

## 🔄 Fase 6: Re-scraping Global & Resiliencia ante Caídas

### 6.1 Admin Jobs Page

- Botón **"Re-scrapear seleccionados / Todo el catálogo con fuente"**.
- Dispara revalidación y actualización por lotes en segundo plano utilizando las `source_url` memorizadas.
