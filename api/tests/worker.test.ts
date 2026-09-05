import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrapeWorker } from '../src/workers/scrapeWorker.js';
import { jobsService } from '../src/services/jobs.service.js';
import { videoScraper } from '../src/scrapers/videoScraper.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';
import { ScrapeJob } from '../src/types/index.js';

describe('ScrapeWorker Fencing & Heartbeat Enforcement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should immediately abort without scraping or writing to database when updateHeartbeat returns false (lease lost)', async () => {
    const worker = new ScrapeWorker();

    const mockJob: ScrapeJob = {
      id: 'job-fencing-test-123',
      anime_id: 1,
      status: 'processing',
      total_episodes: 1,
      processed_episodes: 0,
      failed_episodes: 0,
      attempts: 1,
      max_attempts: 3,
      error_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Mock DB returning anime and episode list
    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
      if (table === 'animes') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 1, name: 'Test Anime', slug: 'test-anime', episodes: 1 },
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'episodes') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ id: 1001, episode_number: 1 }],
                error: null,
              }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    // 2. Mock heartbeat returning false (lease lost before processing episode)
    const heartbeatSpy = vi.spyOn(jobsService, 'updateHeartbeat').mockResolvedValue(false);

    // 3. Spies on videoScraper and finishJob to verify zero side-effects
    const scraperSpy = vi.spyOn(videoScraper, 'scrapeEpisodeServers');
    const finishSpy = vi.spyOn(jobsService, 'finishJob');
    const progressSpy = vi.spyOn(jobsService, 'updateProgress');

    // 4. Run processJob
    await worker.processJob(mockJob);

    // 5. Verification
    expect(heartbeatSpy).toHaveBeenCalledTimes(1);
    expect(scraperSpy).not.toHaveBeenCalled(); // NO scraping attempted
    expect(progressSpy).not.toHaveBeenCalled(); // NO progress updated
    expect(finishSpy).not.toHaveBeenCalled(); // Worker did not touch job completion state
  });

  it('should proceed to scrape and update progress when updateHeartbeat returns true', async () => {
    const worker = new ScrapeWorker();

    const mockJob: ScrapeJob = {
      id: 'job-valid-lease-456',
      anime_id: 2,
      status: 'processing',
      total_episodes: 1,
      processed_episodes: 0,
      failed_episodes: 0,
      attempts: 1,
      max_attempts: 3,
      error_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Mock DB queries
    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
      if (table === 'animes') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 2, name: 'Active Anime', slug: 'active-anime', episodes: 1 },
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'episodes') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ id: 2001, episode_number: 1 }],
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: async () => ({ error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'episode_sources') {
        return {
          upsert: async () => ({ error: null }),
        } as any;
      }
      return {} as any;
    });

    // 2. Mock valid lease (true)
    vi.spyOn(jobsService, 'updateHeartbeat').mockResolvedValue(true);
    vi.spyOn(jobsService, 'updateProgress').mockResolvedValue(true);
    vi.spyOn(jobsService, 'finishJob').mockResolvedValue(true);

    const scraperSpy = vi.spyOn(videoScraper, 'scrapeEpisodeServers').mockResolvedValueOnce([
      {
        provider: 'mega',
        server_name: 'Mega',
        embed_url: 'https://mega.nz/embed/test1234',
        language: 'sub',
        quality: '1080p',
        priority: 10,
        is_active: true,
      },
    ]);

    await worker.processJob(mockJob);

    expect(scraperSpy).toHaveBeenCalledWith('active-anime', 1);
    expect(jobsService.finishJob).toHaveBeenCalledWith(
      'job-valid-lease-456',
      expect.any(String),
      'completed',
      1,
      0,
      []
    );
  });
});
