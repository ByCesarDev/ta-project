import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { env } from '../config/env.js';
import { JobStatus, ScrapeJob, SourcePreviewResult } from '../types/index.js';
import { videoScraper } from '../scrapers/videoScraper.service.js';

export interface CreateJobOptions {
  animeId: number;
  requestedBy?: string;
  totalEpisodes?: number;
  sourceUrl?: string;
  sourceId?: string;
  frozenConfig?: Record<string, any>;
  sourceConfig?: Record<string, any>;
  targetMode?: 'all' | 'single' | 'pending';
  targetEpisodeNumber?: number;
}

export class JobsService {
  /**
   * Creates a new scrape job in pending state
   */
  public async createJob(
    optsOrAnimeId: CreateJobOptions | number,
    requestedBy?: string,
    totalEpisodes: number = 0
  ): Promise<ScrapeJob> {
    const opts: CreateJobOptions =
      typeof optsOrAnimeId === 'number'
        ? {
            animeId: optsOrAnimeId,
            requestedBy,
            totalEpisodes,
          }
        : optsOrAnimeId;

    const sourceConfig = opts.sourceConfig || opts.frozenConfig || (opts.sourceUrl ? { source_url: opts.sourceUrl } : null);

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .insert({
        anime_id: opts.animeId,
        status: 'pending' as JobStatus,
        total_episodes: opts.totalEpisodes || 0,
        processed_episodes: 0,
        failed_episodes: 0,
        error_log: [],
        requested_by: opts.requestedBy || null,
        source_url: opts.sourceUrl || null,
        source_id: opts.sourceId || null,
        frozen_config: opts.frozenConfig || {},
        source_config: sourceConfig,
        target_mode: opts.targetMode || 'all',
        target_episode_number: opts.targetEpisodeNumber ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create scrape job: ${error.message}`);
    }

    return data as ScrapeJob;
  }

  /**
   * Previews a source without creating a job
   */
  public async previewSource(sourceUrl: string): Promise<SourcePreviewResult | null> {
    return videoScraper.previewSource(sourceUrl);
  }

  /**
   * Retrieves a job by UUID
   */
  public async getJobById(jobId: string): Promise<ScrapeJob | null> {
    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch job ${jobId}: ${error.message}`);
    }

    return data as ScrapeJob | null;
  }

  /**
   * Retrieves next pending job and marks it as processing with atomic lease and zombie recovery
   */
  public async claimNextPendingJob(workerId: string = 'worker-default'): Promise<ScrapeJob | null> {
    const isProd = env.NODE_ENV === 'production';

    try {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('claim_next_scrape_job', {
        p_worker_id: workerId,
      });

      if (rpcError) {
        if (isProd) {
          console.error(`💥 [Critical Fail-Closed] claim_next_scrape_job RPC failed in production: ${rpcError.message}`);
          throw new Error(`claim_next_scrape_job RPC failed in production: ${rpcError.message}`);
        }
      } else if (Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData[0] as ScrapeJob;
      } else {
        return null;
      }
    } catch (err) {
      if (isProd) {
        throw err;
      }
    }

    // Fallback for development
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('scrape_jobs')
        .update({
          status: 'pending' as JobStatus,
          locked_at: null,
          locked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'processing')
        .lt('locked_at', tenMinutesAgo);
    } catch {
      // ignore
    }

    const { data: pendingJobs, error: selectError } = await supabaseAdmin
      .from('scrape_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (selectError || !pendingJobs || pendingJobs.length === 0) {
      return null;
    }

    const job = pendingJobs[0];
    const now = new Date().toISOString();
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('scrape_jobs')
      .update({
        status: 'processing' as JobStatus,
        attempts: (job.attempts || 0) + 1,
        locked_at: now,
        locked_by: workerId,
        heartbeat_at: now,
        updated_at: now,
      })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (updateError || !updatedJob) {
      return null;
    }

    return updatedJob as ScrapeJob;
  }

  /**
   * Heartbeat updater with worker fencing
   */
  public async updateHeartbeat(jobId: string, workerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('scrape_jobs')
        .update({
          heartbeat_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', 'processing')
        .eq('locked_by', workerId)
        .select('id')
        .maybeSingle();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Progress updater with worker fencing
   */
  public async updateProgress(
    jobId: string,
    workerId: string,
    processedEpisodes: number,
    failedEpisodes: number,
    errorLog: unknown[]
  ): Promise<boolean> {
    try {
      const { data: rpcSuccess, error: rpcError } = await supabaseAdmin.rpc('update_scrape_job_progress', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_processed: processedEpisodes,
        p_failed: failedEpisodes,
        p_error_log: errorLog,
      });

      if (!rpcError && typeof rpcSuccess === 'boolean') {
        return rpcSuccess;
      }
    } catch {
      // Fall through to direct fenced update
    }

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .update({
        processed_episodes: processedEpisodes,
        failed_episodes: failedEpisodes,
        error_log: errorLog,
        heartbeat_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'processing')
      .eq('locked_by', workerId)
      .select('id')
      .maybeSingle();

    return !error && !data;
  }

  /**
   * Completes, partials or fails a job with worker fencing and clears lock lease
   */
  public async finishJob(
    jobId: string,
    workerId: string,
    status: 'completed' | 'partial' | 'failed',
    processedEpisodes: number,
    failedEpisodes: number,
    errorLog: unknown[]
  ): Promise<boolean> {
    try {
      const { data: rpcSuccess, error: rpcError } = await supabaseAdmin.rpc('finish_scrape_job', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_status: status,
        p_processed: processedEpisodes,
        p_failed: failedEpisodes,
        p_error_log: errorLog,
      });

      if (!rpcError && typeof rpcSuccess === 'boolean') {
        return rpcSuccess;
      }
    } catch {
      // Fall through to direct fenced update
    }

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .update({
        status,
        processed_episodes: processedEpisodes,
        failed_episodes: failedEpisodes,
        error_log: errorLog,
        locked_at: null,
        locked_by: null,
        heartbeat_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'processing')
      .eq('locked_by', workerId)
      .select('id')
      .maybeSingle();

    return !error && !data;
  }
}

export const jobsService = new JobsService();
