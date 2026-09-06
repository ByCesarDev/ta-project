import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { env } from '../config/env.js';
import { jobsService } from '../services/jobs.service.js';
import { videoScraper } from '../scrapers/videoScraper.service.js';
import { ScrapeJob } from '../types/index.js';

export class ScrapeWorker {
  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private pollIntervalMs: number;
  private workerId: string;

  constructor(pollIntervalMs: number = env.WORKER_POLL_INTERVAL_MS) {
    this.pollIntervalMs = pollIntervalMs;
    this.workerId = `worker-${process.pid}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Starts the background worker polling loop
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.shouldStop = false;

    console.log(`[ScrapeWorker] Worker started with ID '${this.workerId}'. Polling every ${this.pollIntervalMs}ms...`);

    while (!this.shouldStop) {
      try {
        const job = await jobsService.claimNextPendingJob(this.workerId);
        if (job) {
          console.log(`[ScrapeWorker] Claimed Job ${job.id} for Anime ID: ${job.anime_id}`);
          await this.processJob(job);
        } else {
          // No job pending, wait for poll interval
          await this.sleep(this.pollIntervalMs);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown worker loop error';
        console.error('[ScrapeWorker] Error in polling loop:', message);
        await this.sleep(this.pollIntervalMs);
      }
    }

    this.isRunning = false;
    console.log('[ScrapeWorker] Worker stopped gracefully.');
  }

  /**
   * Signals the worker to finish current job and stop polling
   */
  public stop(): void {
    console.log('[ScrapeWorker] Stop requested...');
    this.shouldStop = true;
  }

  /**
   * Processes a single scrape job
   */
  public async processJob(job: ScrapeJob): Promise<void> {
    const errorLog: { episode_number: number; error: string; timestamp: string }[] = [];
    let processed = 0;
    let failed = 0;

    try {
      // 1. Fetch Anime details
      const { data: anime, error: animeError } = await supabaseAdmin
        .from('animes')
        .select('id, name, slug, title_romaji, episodes')
        .eq('id', job.anime_id)
        .single();

      if (animeError || !anime) {
        throw new Error(`Anime not found with ID ${job.anime_id}: ${animeError?.message}`);
      }

      // 2. Fetch or initialize Episodes
      const { data: episodes, error: epError } = await supabaseAdmin
        .from('episodes')
        .select('id, episode_number')
        .eq('anime_id', anime.id)
        .order('episode_number', { ascending: true });

      if (epError) {
        throw new Error(`Failed to load episodes for anime ${anime.id}: ${epError.message}`);
      }

      const episodeList = episodes || [];

      if (episodeList.length === 0) {
        console.warn(`[ScrapeWorker] No episodes found in database for anime ${anime.slug}.`);
        await jobsService.finishJob(job.id, this.workerId, 'completed', 0, 0, [
          { message: 'No episodes to scrape in database', timestamp: new Date().toISOString() },
        ]);
        return;
      }

      // 3. Process each episode
      const fallbackSlug = anime.title_romaji
        ? videoScraper.formatSlug(anime.title_romaji)
        : undefined;

      for (const ep of episodeList) {
        if (this.shouldStop) {
          console.warn(`[ScrapeWorker] Job ${job.id} interrupted by worker stop signal.`);
          break;
        }

        // Renew heartbeat lease while working on this job with pre-side-effect fencing
        const heartbeatOk = await jobsService.updateHeartbeat(job.id, this.workerId);
        if (!heartbeatOk) {
          console.warn(
            `[ScrapeWorker] Lease lost for Job ${job.id} before episode ${ep.episode_number} processing. Aborting without side-effects.`
          );
          return;
        }

        try {
          const servers = fallbackSlug
            ? await videoScraper.scrapeEpisodeServers(anime.slug, ep.episode_number, 'sub', fallbackSlug)
            : await videoScraper.scrapeEpisodeServers(anime.slug, ep.episode_number);

          if (servers.length === 0) {
            failed++;
            errorLog.push({
              episode_number: ep.episode_number,
              error: `No video servers found on scraper provider for episode ${ep.episode_number}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Upsert sources into public.episode_sources
            for (const s of servers) {
              const { error: insertError } = await supabaseAdmin
                .from('episode_sources')
                .upsert(
                  {
                    episode_id: ep.id,
                    provider: s.provider,
                    server_name: s.server_name,
                    embed_url: s.embed_url,
                    language: s.language,
                    quality: s.quality,
                    priority: s.priority,
                    is_active: s.is_active ?? true,
                    last_verified_at: new Date().toISOString(),
                  },
                  {
                    onConflict: 'episode_id,provider,language,quality',
                    ignoreDuplicates: false,
                  }
                );

              if (insertError) {
                console.warn(
                  `[ScrapeWorker] Warning upserting source for ep ${ep.episode_number}:`,
                  insertError.message
                );
              }
            }

            // Synchronize episode status: available ONLY if there are active, verified sources
            const hasActiveSource = servers.some((s) => s.is_active);
            const targetStatus = hasActiveSource ? 'available' : 'pending';

            await supabaseAdmin
              .from('episodes')
              .update({ status: targetStatus, updated_at: new Date().toISOString() })
              .eq('id', ep.id);

            processed++;
          }
        } catch (epErr: unknown) {
          failed++;
          const message = epErr instanceof Error ? epErr.message : 'Unknown episode scrape error';
          errorLog.push({
            episode_number: ep.episode_number,
            error: message,
            timestamp: new Date().toISOString(),
          });
        }

        // Periodically update progress with worker fencing check
        const progressOk = await jobsService.updateProgress(
          job.id,
          this.workerId,
          processed,
          failed,
          errorLog
        );

        if (!progressOk) {
          console.warn(
            `[ScrapeWorker] Lease lost for Job ${job.id}. Another worker took ownership or job was reset. Aborting.`
          );
          return;
        }

        // Friendly throttle between requests
        await this.sleep(400);
      }

      // 4. Mark job completion status with worker fencing
      const finalStatus = processed > 0 ? 'completed' : 'failed';
      const finishOk = await jobsService.finishJob(
        job.id,
        this.workerId,
        finalStatus,
        processed,
        failed,
        errorLog
      );

      if (!finishOk) {
        console.warn(
          `[ScrapeWorker] Could not finalize Job ${job.id}: lease lost or already completed by another worker.`
        );
        return;
      }

      console.log(
        `[ScrapeWorker] Finished Job ${job.id} (${finalStatus}). Processed: ${processed}, Failed: ${failed}`
      );
    } catch (jobErr: unknown) {
      const message = jobErr instanceof Error ? jobErr.message : 'Job execution failed';
      console.error(`[ScrapeWorker] Critical failure on Job ${job.id}:`, message);
      await jobsService.finishJob(job.id, this.workerId, 'failed', processed, failed, [
        ...errorLog,
        { error: message, timestamp: new Date().toISOString() },
      ]);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Standalone worker execution when run directly: `node dist/workers/scrapeWorker.js`
if (process.argv[1]?.includes('scrapeWorker')) {
  const worker = new ScrapeWorker();

  process.on('SIGINT', () => {
    worker.stop();
  });
  process.on('SIGTERM', () => {
    worker.stop();
  });

  worker.start().catch((err) => {
    console.error('[ScrapeWorker] Fatal crash:', err);
    process.exit(1);
  });
}
