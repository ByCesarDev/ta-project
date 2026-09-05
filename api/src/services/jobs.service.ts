import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { JobStatus, ScrapeJob } from '../types/index.js';

export class JobsService {
  /**
   * Creates a new scrape job in public.scrape_jobs
   */
  public async createJob(
    animeId: number,
    requestedBy?: string,
    totalEpisodes: number = 0
  ): Promise<ScrapeJob> {
    // If totalEpisodes is 0, check how many episodes exist for this anime
    let total = totalEpisodes;
    if (total <= 0) {
      const { count } = await supabaseAdmin
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('anime_id', animeId);
      total = count || 0;
    }

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .insert({
        anime_id: animeId,
        status: 'pending' as JobStatus,
        total_episodes: total,
        processed_episodes: 0,
        failed_episodes: 0,
        error_log: [],
        requested_by: requestedBy || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create scrape job: ${error.message}`);
    }

    return data as ScrapeJob;
  }

  /**
   * Retrieves a job by ID
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
   * Retrieves next pending job and marks it as processing
   */
  public async claimNextPendingJob(): Promise<ScrapeJob | null> {
    // Select oldest pending job
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

    // Atomically transition status from pending to processing
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('scrape_jobs')
      .update({
        status: 'processing' as JobStatus,
        updated_at: new Date().toISOString(),
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
   * Updates progress of an in-flight job
   */
  public async updateProgress(
    jobId: string,
    processedEpisodes: number,
    failedEpisodes: number,
    errorLog: unknown[]
  ): Promise<void> {
    await supabaseAdmin
      .from('scrape_jobs')
      .update({
        processed_episodes: processedEpisodes,
        failed_episodes: failedEpisodes,
        error_log: errorLog,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }

  /**
   * Completes or fails a job
   */
  public async finishJob(
    jobId: string,
    status: 'completed' | 'failed',
    processedEpisodes: number,
    failedEpisodes: number,
    errorLog: unknown[]
  ): Promise<void> {
    await supabaseAdmin
      .from('scrape_jobs')
      .update({
        status,
        processed_episodes: processedEpisodes,
        failed_episodes: failedEpisodes,
        error_log: errorLog,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

export const jobsService = new JobsService();
