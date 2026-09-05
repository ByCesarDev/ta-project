import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { videoScraper } from '../scrapers/videoScraper.service.js';
import { StreamLanguage } from '../types/index.js';

export class StreamController {
  /**
   * GET /api/v1/stream/:animeSlug/:episodeNumber
   * Fetches active stream sources from database, falling back to live scraper if missing.
   */
  public async getStreamSources(req: Request, res: Response): Promise<void> {
    const rawSlug = Array.isArray(req.params.animeSlug) ? req.params.animeSlug[0] : req.params.animeSlug;
    const rawEp = Array.isArray(req.params.episodeNumber) ? req.params.episodeNumber[0] : req.params.episodeNumber;

    const animeSlug = String(rawSlug || '').trim();
    const episodeNumber = String(rawEp || '').trim();
    const lang = (req.query.lang as StreamLanguage) || 'sub';
    const forceRefresh = req.query.refresh === 'true';

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
        .select('id, name, slug')
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
      const scrapedServers = await videoScraper.scrapeEpisodeServers(animeSlug, epNum, lang);

      if (scrapedServers.length === 0) {
        res.status(404).json({
          error: 'NotFound',
          message: `No streaming sources found for ${animeSlug} episode ${epNum}.`,
          servers: [],
        });
        return;
      }

      // Asynchronously persist discovered servers to DB if episode row exists
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
                is_active: true,
                last_verified_at: new Date().toISOString(),
              },
              { onConflict: 'episode_id,provider,language,quality' }
            )
            .then(({ error }) => {
              if (error) console.warn('[StreamController] Error persisting source:', error.message);
            });
        }
      }

      res.status(200).json({
        source: 'live_scraped',
        anime: { id: anime?.id, name: anime?.name || animeSlug, slug: animeSlug },
        episode_number: epNum,
        language: lang,
        servers: scrapedServers,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown stream error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Failed to retrieve stream sources: ${message}`,
      });
    }
  }
}

export const streamController = new StreamController();
