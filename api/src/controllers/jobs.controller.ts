import { Response } from 'express';
import { jobsService } from '../services/jobs.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { videoScraper } from '../scrapers/videoScraper.service.js';

export class JobsController {
  constructor() {
    this.createScrapeJob = this.createScrapeJob.bind(this);
    this.previewSource = this.previewSource.bind(this);
    this.bulkRescrape = this.bulkRescrape.bind(this);
    this.getJobStatus = this.getJobStatus.bind(this);
    this.listJobs = this.listJobs.bind(this);
  }

  /**
   * POST /api/v1/jobs/preview-source
   * Inspects a Seekee/Cluster URL/hash and returns title, published episodes, and available audio variants
   */
  public async previewSource(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sourceUrl } = req.body;

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'sourceUrl (string) is required in the request body.',
      });
      return;
    }

    try {
      const preview = await jobsService.previewSource(sourceUrl.trim());
      if (!preview) {
        res.status(404).json({
          error: 'NotFound',
          message: 'No se pudo obtener información de la fuente suministrada. Verifica que la URL o hash sea válido.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        preview,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Error al inspeccionar la fuente: ${message}`,
      });
    }
  }

  /**
   * POST /api/v1/jobs/scrape
   * Creates a background scraping job with frozen source configuration
   */
  public async createScrapeJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const {
      animeId,
      totalEpisodes,
      sourceUrl,
      targetMode = 'all',
      targetEpisodeNumber,
    } = req.body;

    if (!animeId || typeof animeId !== 'number') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'animeId (number) is required in the request body.',
      });
      return;
    }

    try {
      // 1. Check if anime exists
      const { data: anime, error: animeError } = await supabaseAdmin
        .from('animes')
        .select('id, name, slug, episodes, source_url, source_id, status')
        .eq('id', animeId)
        .maybeSingle();

      if (animeError || !anime) {
        res.status(404).json({
          error: 'NotFound',
          message: `Anime with ID ${animeId} does not exist.`,
        });
        return;
      }

      // 2. Check active jobs for this anime
      const { data: activeJobs } = await supabaseAdmin
        .from('scrape_jobs')
        .select('id, status, created_at')
        .eq('anime_id', animeId)
        .in('status', ['pending', 'processing'])
        .limit(1);

      if (activeJobs && activeJobs.length > 0) {
        res.status(409).json({
          error: 'Conflict',
          message: `Ya existe un job de scraping activo (${activeJobs[0]?.id}) en progreso para "${anime.name}".`,
          job: activeJobs[0],
        });
        return;
      }

      // 3. Resolve and freeze source configuration
      const effectiveSourceUrl = (sourceUrl || anime.source_url || '').trim();
      let sourceId = anime.source_id;
      let frozenConfig: Record<string, any> = {};

      if (effectiveSourceUrl) {
        sourceId = videoScraper.formatSlug(effectiveSourceUrl);
        // Quick preview to freeze discovered variants and episode count
        try {
          const preview = await videoScraper.previewSource(effectiveSourceUrl);
          if (preview) {
            frozenConfig = {
              source_title: preview.title,
              category: preview.category_name,
              published_episodes: preview.published_episodes,
              variants: preview.variants,
            };

            // Permanently save source_url, source_id and discovered_variants to anime row
            await supabaseAdmin
              .from('animes')
              .update({
                source_url: effectiveSourceUrl,
                source_id: sourceId,
                discovered_variants: preview.variants,
                updated_at: new Date().toISOString(),
              })
              .eq('id', animeId);
          }
        } catch {
          // If preview fails, still proceed with url
        }
      }

      const total =
        totalEpisodes ||
        (frozenConfig.published_episodes?.length ?? anime.episodes) ||
        0;

      const job = await jobsService.createJob({
        animeId,
        requestedBy: req.user?.id,
        totalEpisodes: total,
        sourceUrl: effectiveSourceUrl || undefined,
        sourceId: sourceId || undefined,
        frozenConfig,
        targetMode: targetMode as 'all' | 'single' | 'pending',
        targetEpisodeNumber:
          typeof targetEpisodeNumber === 'number' ? targetEpisodeNumber : undefined,
      });

      res.status(201).json({
        message: `Job de scraping iniciado con éxito para "${anime.name}".`,
        job,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Error al crear el job de scraping: ${message}`,
      });
    }
  }

  /**
   * POST /api/v1/jobs/bulk-rescrape
   * Re-triggers scrape jobs for all animes with saved source_urls
   */
  public async bulkRescrape(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { animeIds } = req.body;

      let query = supabaseAdmin
        .from('animes')
        .select('id, name, slug, episodes, source_url, source_id, status')
        .not('source_url', 'is', null);

      if (Array.isArray(animeIds) && animeIds.length > 0) {
        query = query.in('id', animeIds);
      }

      const { data: animes, error } = await query;
      if (error) {
        res.status(500).json({
          error: 'DatabaseError',
          message: `Error al consultar animes con fuente: ${error.message}`,
        });
        return;
      }

      if (!animes || animes.length === 0) {
        res.status(200).json({
          message: 'No se encontraron animes con source_url configurada para re-scrapear.',
          queuedCount: 0,
        });
        return;
      }

      let queuedCount = 0;
      for (const a of animes) {
        // Skip if active job already running
        const { data: active } = await supabaseAdmin
          .from('scrape_jobs')
          .select('id')
          .eq('anime_id', a.id)
          .in('status', ['pending', 'processing'])
          .limit(1);

        if (!active || active.length === 0) {
          await jobsService.createJob({
            animeId: a.id,
            requestedBy: req.user?.id,
            totalEpisodes: a.episodes || 0,
            sourceUrl: a.source_url,
            sourceId: a.source_id,
            targetMode: 'all',
          });
          queuedCount++;
        }
      }

      res.status(200).json({
        message: `Se han encolado exitosamente ${queuedCount} animes para re-scrapear en segundo plano.`,
        queuedCount,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Error en re-scrapear masivo: ${message}`,
      });
    }
  }

  /**
   * GET /api/v1/jobs/:jobId
   * Retrieves status and progress of a scrape job
   */
  public async getJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId || '').trim();

    if (!jobId) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'jobId parameter is required.',
      });
      return;
    }

    try {
      const job = await jobsService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: 'NotFound',
          message: `Job ${jobId} no encontrado.`,
        });
        return;
      }

      res.status(200).json({ job });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Error al consultar estado del job: ${message}`,
      });
    }
  }

  /**
   * GET /api/v1/jobs
   * Lists scrape jobs with filtering options
   */
  public async listJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const animeId = req.query.animeId ? parseInt(req.query.animeId as string, 10) : undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

    try {
      let query = supabaseAdmin
        .from('scrape_jobs')
        .select('*, animes(id, name, slug)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (animeId) {
        query = query.eq('anime_id', animeId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: jobs, error } = await query;

      if (error) {
        res.status(500).json({
          error: 'DatabaseError',
          message: `Error al consultar jobs: ${error.message}`,
        });
        return;
      }

      res.status(200).json({ jobs: jobs || [] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Error al listar jobs: ${message}`,
      });
    }
  }

  /**
   * GET /api/v1/jobs/cloudflare/status
   */
  public async getCloudflareStatus(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const { cloudflareCookieService } = await import('../services/cloudflareCookie.service.js');
    const clearance = cloudflareCookieService.getClearance();
    res.status(200).json({
      hasClearance: Boolean(clearance?.cookie),
      clearance,
    });
  }

  /**
   * POST /api/v1/jobs/cloudflare/save
   */
  public async saveCloudflareClearance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { cookie, userAgent } = req.body;
    if (!cookie || typeof cookie !== 'string') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'cookie (string) is required.',
      });
      return;
    }

    const { cloudflareCookieService } = await import('../services/cloudflareCookie.service.js');
    cloudflareCookieService.saveClearance(cookie, userAgent);
    res.status(200).json({
      message: 'Cloudflare cf_clearance guardado exitosamente.',
      clearance: cloudflareCookieService.getClearance(),
    });
  }

  /**
   * POST /api/v1/jobs/cloudflare/solve
   */
  public async solveCloudflareClearance(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const { cloudflareCookieService } = await import('../services/cloudflareCookie.service.js');
    const result = await cloudflareCookieService.launchSolverWindow();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  }
}

export const jobsController = new JobsController();
