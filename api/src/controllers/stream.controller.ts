import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { videoScraper } from '../scrapers/videoScraper.service.js';
import { sanitizeEmbedUrl, normalizeServer } from '../scrapers/serverParsers.js';
import { AuthenticatedRequest, StreamLanguage } from '../types/index.js';

export class StreamController {
  /**
   * GET /api/v1/stream/:animeSlug/:episodeNumber
   * Fetches active stream sources from database, falling back to live scraper if missing.
   */
  public async getStreamSources(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawSlug = Array.isArray(req.params.animeSlug) ? req.params.animeSlug[0] : req.params.animeSlug;
    const rawEp = Array.isArray(req.params.episodeNumber) ? req.params.episodeNumber[0] : req.params.episodeNumber;

    const animeSlug = String(rawSlug || '').trim();
    const episodeNumber = String(rawEp || '').trim();
    const lang = (req.query.lang as StreamLanguage) || 'sub';
    // Security: only authenticated staff (moderators/admins) can force live scraping bypass
    const isStaff = req.user?.role === 'admin' || req.user?.role === 'moderator';
    const forceRefresh = req.query.refresh === 'true' && isStaff;

    if (!animeSlug || !episodeNumber) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'animeSlug and episodeNumber parameters are required.',
      });
      return;
    }

    const epNum = parseInt(episodeNumber, 10);
    if (isNaN(epNum) || epNum < 0) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'episodeNumber must be a valid positive number.',
      });
      return;
    }


    try {
      // 1. Resolve Anime from DB
      const { data: anime, error: animeError } = await supabaseAdmin
        .from('animes')
        .select('id, name, slug, title_romaji')
        .eq('slug', animeSlug)
        .maybeSingle();

      if (animeError) {
        res.status(500).json({
          error: 'DatabaseError',
          message: `Failed to query anime: ${animeError.message}`,
        });
        return;
      }

      // 2. Resolve Episode from DB if anime found
      let episodeId: number | null = null;
      if (anime) {
        const { data: epData } = await supabaseAdmin
          .from('episodes')
          .select('id')
          .eq('anime_id', anime.id)
          .eq('episode_number', epNum)
          .maybeSingle();

        if (epData) {
          episodeId = epData.id;
        }
      }

      // 3. If episode exists in DB and not forceRefresh, check stored sources
      if (episodeId && !forceRefresh) {
        const { data: dbSources, error: sourcesError } = await supabaseAdmin
          .from('episode_sources')
          .select('id, provider, server_name, embed_url, direct_stream_url, language, quality, priority')
          .eq('episode_id', episodeId)
          .eq('is_active', true)
          .eq('language', lang)
          .order('priority', { ascending: true });

        if (!sourcesError && dbSources && dbSources.length > 0) {
          res.status(200).json({
            source: 'cache',
            anime: { id: anime?.id, name: anime?.name, slug: anime?.slug },
            episode_number: epNum,
            language: lang,
            servers: dbSources,
          });
          return;
        }
      }

      // 4. Live Scraper Fallback
      const fallbackSlug = anime?.title_romaji
        ? videoScraper.formatSlug(anime.title_romaji)
        : undefined;
      const scrapedServers = await videoScraper.scrapeEpisodeServers(
        animeSlug,
        epNum,
        lang,
        fallbackSlug
      );

      // Security: Filter active (verified) servers for public playback
      const activeScrapedServers = scrapedServers.filter((s) => s.is_active);

      if (scrapedServers.length === 0) {
        res.status(404).json({
          error: 'NotFound',
          message: `No streaming sources found for ${animeSlug} episode ${epNum}.`,
          servers: [],
        });
        return;
      }

      // Asynchronously persist discovered servers to DB respecting s.is_active quarantine flag
      if (episodeId) {
        for (const s of scrapedServers) {
          supabaseAdmin
            .from('episode_sources')
            .upsert(
              {
                episode_id: episodeId,
                provider: s.provider,
                server_name: s.server_name,
                embed_url: s.embed_url,
                language: s.language,
                quality: s.quality,
                priority: s.priority,
                is_active: Boolean(s.is_active),
                last_verified_at: new Date().toISOString(),
              },
              { onConflict: 'episode_id,provider,language,quality' }
            )
            .then(async ({ error }) => {
              if (error) {
                console.warn('[StreamController] Error persisting source:', error.message);
              } else {
                await streamController.syncEpisodeAvailability(episodeId);
              }
            });
        }
      }

      // If all scraped servers are unverified/quarantined, do not leak them to the public response
      if (activeScrapedServers.length === 0) {
        res.status(404).json({
          error: 'NotFound',
          message: `Streaming sources for ${animeSlug} episode ${epNum} are currently under quarantine/review.`,
          servers: [],
        });
        return;
      }

      res.status(200).json({
        source: 'live_scraped',
        anime: { id: anime?.id, name: anime?.name || animeSlug, slug: animeSlug },
        episode_number: epNum,
        language: lang,
        servers: activeScrapedServers,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown stream error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Failed to retrieve stream sources: ${message}`,
      });
    }
  }

  /**
   * POST /api/v1/stream/validate-source
   * Validates a single embed URL against SSRF policy and provider allowlist.
   */
  public async validateSource(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { embed_url, hint_name, language = 'sub' } = req.body;

    if (!embed_url || typeof embed_url !== 'string') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'embed_url is required.',
      });
      return;
    }

    const sanitized = sanitizeEmbedUrl(embed_url);
    if (!sanitized) {
      res.status(400).json({
        error: 'InvalidUrl',
        message: 'URL inválida o rechazada por directiva de seguridad SSRF (no se permiten dominios privados ni esquemas inseguros).',
      });
      return;
    }

    const normalized = normalizeServer(embed_url, hint_name, language);
    if (!normalized) {
      res.status(400).json({
        error: 'InvalidUrl',
        message: 'No se pudo normalizar el servidor a partir de la URL suministrada.',
      });
      return;
    }

    res.status(200).json({
      valid: true,
      server: normalized,
      is_known_provider: normalized.is_active,
      is_quarantined: !normalized.is_active,
    });
  }

  /**
   * PUT /api/v1/stream/episodes/:episodeId/sources
   * Centralized endpoint to validate and upsert episode streaming sources.
   */
  public async upsertEpisodeSources(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawEpId = Array.isArray(req.params.episodeId) ? req.params.episodeId[0] : req.params.episodeId;
    const episodeId = parseInt(String(rawEpId || ''), 10);
    const isAdmin = req.user?.role === 'admin';

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'ID de episodio no válido.',
      });
      return;
    }

    const { sources = [], deleted_ids = [] } = req.body;

    // RBAC: Hard delete of sources is restricted to admins
    if (deleted_ids && deleted_ids.length > 0) {
      if (!isAdmin) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Solo administradores tienen privilegios para eliminar fuentes definitivamente. Los moderadores pueden desactivarlas.',
        });
        return;
      }

      const { error: delError } = await supabaseAdmin
        .from('episode_sources')
        .delete()
        .in('id', deleted_ids);

      if (delError) {
        res.status(500).json({
          error: 'DatabaseError',
          message: `Error al eliminar fuentes: ${delError.message}`,
        });
        return;
      }
    }

    // Process and validate each source
    if (sources && sources.length > 0) {
      const sanitizedPayload = [];

      for (const s of sources) {
        const sanitizedUrl = sanitizeEmbedUrl(s.embed_url);
        if (!sanitizedUrl) {
          res.status(400).json({
            error: 'InvalidUrl',
            message: `URL inválida o rechazada por seguridad SSRF: ${s.embed_url}`,
          });
          return;
        }

        const normalized = normalizeServer(sanitizedUrl, s.server_name, s.language);
        const isKnown = normalized?.is_active ?? false;

        // Hardening: Unknown/custom providers MUST be quarantined (is_active = false)
        // unless an admin explicitly approves or moderates them
        let activeStatus = s.is_active ?? isKnown;
        if (!isKnown && !s.id && !isAdmin) {
          // Brand new unverified source added by moderator defaults to quarantine
          activeStatus = false;
        }

        sanitizedPayload.push({
          ...(s.id ? { id: s.id } : {}),
          episode_id: episodeId,
          provider: s.provider || normalized?.provider || 'custom',
          server_name: s.server_name || normalized?.server_name || 'Personalizado',
          embed_url: sanitizedUrl,
          direct_stream_url: s.direct_stream_url || null,
          language: s.language || 'sub',
          quality: s.quality || '1080p',
          priority: s.priority ?? 10,
          is_active: activeStatus,
          last_verified_at: new Date().toISOString(),
        });
      }

      const { data: upsertedData, error: upsertError } = await supabaseAdmin
        .from('episode_sources')
        .upsert(sanitizedPayload, { onConflict: 'episode_id,provider,language,quality' })
        .select('*');

      if (upsertError) {
        res.status(500).json({
          error: 'DatabaseError',
          message: `Error al registrar fuentes: ${upsertError.message}`,
        });
        return;
      }

      // Automatically synchronize episode availability status based on real active sources count
      const updatedStatus = await this.syncEpisodeAvailability(episodeId);

      res.status(200).json({
        message: 'Fuentes sincronizadas exitosamente.',
        sources: upsertedData,
        episode_status: updatedStatus,
      });
      return;
    }

    // When sources array was empty (e.g. only deleted_ids were supplied)
    const updatedStatus = await this.syncEpisodeAvailability(episodeId);

    res.status(200).json({
      message: 'Operación completada sin fuentes adicionales.',
      sources: [],
      episode_status: updatedStatus,
    });
  }

  /**
   * Synchronizes public.episodes.status based on count of active sources.
   * > 0 active sources -> 'available'
   * 0 active sources -> 'pending'
   */
  public async syncEpisodeAvailability(episodeId: number): Promise<'available' | 'pending'> {
    try {
      const { count, error } = await supabaseAdmin
        .from('episode_sources')
        .select('*', { count: 'exact', head: true })
        .eq('episode_id', episodeId)
        .eq('is_active', true);

      const activeCount = !error && typeof count === 'number' ? count : 0;
      const targetStatus = activeCount > 0 ? 'available' : 'pending';

      await supabaseAdmin
        .from('episodes')
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq('id', episodeId);

      return targetStatus;
    } catch (err) {
      console.warn(`[StreamController] Failed to sync availability for episode ${episodeId}:`, err);
      return 'pending';
    }
  }
}

export const streamController = new StreamController();
