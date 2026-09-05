import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { env } from '../config/env.js';
import { JobStatus, ScrapeJob } from '../types/index.js';

export class JobsService {
  /**
   * Creates a new scrape job in pending state
   */
  public async createJob(
    animeId: number,
    requestedBy?: string,
    totalEpisodes: number = 0
  ): Promise<ScrapeJob> {
    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .insert({
        anime_id: animeId,
        status: 'pending' as JobStatus,
        total_episodes: totalEpisodes,
        processed_episodes: 0,
        failed_episodes: 0,
        error_log: [],
        requested_by: requestedBy || null,
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
   * In production, fails closed if atomic RPC fails.
   */
  public async claimNextPendingJob(workerId: string = 'worker-default'): Promise<ScrapeJob | null> {
    const isProd = env.NODE_ENV === 'production';

    try {
      // 1. Primary path: PostgreSQL RPC with atomic FOR UPDATE SKIP LOCKED & zombie rescue
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
        return null; // No pending jobs available
      }
    } catch (err) {
      if (isProd) {
        throw err;
      }
      // Fall through to development/test fallback only
    }

    // 2. Fallback (Development & Test only): Resilient zombie recovery using COALESCE(heartbeat_at, locked_at)
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
      // ignore fallback error
    }

    // 3. Select oldest pending job
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

    // Atomically transition status from pending to processing with lease
    const now = new Date().toISOString();
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('scrape_jobs')
      .update({
        status: 'processing' as JobStatus,
        locked_at: now,
        locked_by: workerId,
        heartbeat_at: now,
        attempts: (job.attempts || 0) + 1,
        updated_at: now,
      })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (updateError || !updatedJob) {
      return null; // Another worker claimed it first
    }

    return updatedJob as ScrapeJob;
  }

  /**
   * Updates worker heartbeat for an in-flight job lease
   */
  public async updateHeartbeat(jobId: string, workerId: string = 'worker-default'): Promise<boolean> {
    try {
      const { data: rpcSuccess, error: rpcError } = await supabaseAdmin.rpc('record_job_heartbeat', {
        p_job_id: jobId,
        p_worker_id: workerId,
      });

      if (!rpcError && typeof rpcSuccess === 'boolean') {
        return rpcSuccess;
      }
    } catch {
      // Fall through to direct update
    }

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .update({
        heartbeat_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'processing')
      .eq('locked_by', workerId)
      .select('id')
      .maybeSingle();

    return !error && !!data;
  }

  /**
   * Updates progress of an in-flight job with worker fencing
   * Returns true if update succeeded, false if worker lost lease
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

    return !error && !!data;
  }

  /**
   * Completes or fails a job with worker fencing and clears lock lease
   * Returns true if finished, false if worker lost lease
   */
  public async finishJob(
    jobId: string,
    workerId: string,
    status: 'completed' | 'failed',
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

    return !error && !!data;
  }
}

export const jobsService = new JobsService();
