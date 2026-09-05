import { Response } from 'express';
import { jobsService } from '../services/jobs.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export class JobsController {
  /**
   * POST /api/v1/jobs/scrape
   * Creates a background scraping job for an anime
   */
  public async createScrapeJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { animeId, totalEpisodes } = req.body;

    if (!animeId || typeof animeId !== 'number') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'animeId (number) is required in the request body.',
      });
      return;
    }

    try {
      // Check if anime exists
      const { data: anime, error: animeError } = await supabaseAdmin
        .from('animes')
        .select('id, name, slug, episodes')
        .eq('id', animeId)
        .maybeSingle();

      if (animeError || !anime) {
        res.status(404).json({
          error: 'NotFound',
          message: `Anime with ID ${animeId} does not exist.`,
        });
        return;
      }

      // Check if there is already an active job for this anime
      const { data: activeJobs } = await supabaseAdmin
        .from('scrape_jobs')
        .select('id, status, created_at')
        .eq('anime_id', animeId)
        .in('status', ['pending', 'processing'])
        .limit(1);

      if (activeJobs && activeJobs.length > 0) {
        res.status(409).json({
          error: 'Conflict',
          message: `An active scrape job (${activeJobs[0]?.id}) is already in progress for ${anime.name}.`,
          job: activeJobs[0],
        });
        return;
      }

      const total = totalEpisodes || anime.episodes || 0;
      const job = await jobsService.createJob(animeId, req.user?.id, total);

      res.status(201).json({
        message: `Scrape job initiated successfully for ${anime.name}.`,
        job,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Failed to create scrape job: ${message}`,
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
          message: `Job ${jobId} not found.`,
        });
        return;
      }

      res.status(200).json({ job });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Failed to retrieve job status: ${message}`,
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
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

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
          message: `Failed to query jobs: ${error.message}`,
        });
        return;
      }

      res.status(200).json({ jobs: jobs || [] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({
        error: 'InternalServerError',
        message: `Failed to list jobs: ${message}`,
      });
    }
  }
}

export const jobsController = new JobsController();
