import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrapeWorker } from '../src/workers/scrapeWorker.js';
import { jobsService } from '../src/services/jobs.service.js';
import { videoScraper } from '../src/scrapers/videoScraper.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';
import { ScrapeJob } from '../src/types/index.js';

function createChainableQuery(data: any = null, error: any = null) {
  const query: any = {
    data,
    error,
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    upsert: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error })),
    maybeSingle: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error })),
    then: (resolve: any, reject?: any) => Promise.resolve({ data, error }).then(resolve, reject),
  };
  return query;
}

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
        return createChainableQuery({ id: 1, name: 'Test Anime', slug: 'test-anime', episodes: 1, source_url: 'https://peliculaplay.com/es/detail/test' });
      }
      if (table === 'episodes') {
        return createChainableQuery([{ id: 1001, episode_number: 1 }]);
      }
      return createChainableQuery({});
    });

    vi.spyOn(videoScraper, 'previewSource').mockResolvedValue({
      provider: 'dramasfree',
      source_id: 'test',
      title: 'Test Anime',
      published_episodes: [1],
      total_episodes: 1,
      variants: [
        {
          variant_id: 'default',
          audio_language: 'ja',
          language_label: 'Japonés (Original)',
          language_type: 'sub',
          available_episodes: [1],
        },
      ],
    });

    // 2. Mock heartbeat returning false (lease lost before processing episode)
    const heartbeatSpy = vi.spyOn(jobsService, 'updateHeartbeat').mockResolvedValue(false);

    // 3. Spies on videoScraper and finishJob to verify zero side-effects
    const scraperSpy = vi.spyOn(videoScraper, 'scrapeAllEpisodeServers');
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
        return createChainableQuery({ id: 2, name: 'Active Anime', slug: 'active-anime', episodes: 1, source_url: 'https://peliculaplay.com/es/detail/active' });
      }
      if (table === 'episodes') {
        return createChainableQuery([{ id: 2001, episode_number: 1 }]);
      }
      return createChainableQuery({});
    });

    vi.spyOn(videoScraper, 'previewSource').mockResolvedValue({
      provider: 'dramasfree',
      source_id: 'active',
      title: 'Active Anime',
      published_episodes: [1],
      total_episodes: 1,
      variants: [
        {
          variant_id: 'default',
          audio_language: 'ja',
          language_label: 'Japonés (Original)',
          language_type: 'sub',
          available_episodes: [1],
        },
      ],
    });

    // 2. Mock valid lease (true)
    vi.spyOn(jobsService, 'updateHeartbeat').mockResolvedValue(true);
    vi.spyOn(jobsService, 'updateProgress').mockResolvedValue(true);
    vi.spyOn(jobsService, 'finishJob').mockResolvedValue(true);

    const scraperSpy = vi.spyOn(videoScraper, 'scrapeAllEpisodeServers').mockResolvedValueOnce([
      {
        provider: 'cluster',
        server_name: 'Cluster (Japonés (Original))',
        embed_url: 'https://example.com/embed/test',
        language: 'sub',
        audio_variant: 'default',
        audio_language: 'ja',
        language_label: 'Japonés (Original)',
        source_key: 'srv_1',
        quality: '1080p',
        priority: 10,
        is_active: true,
      },
    ]);

    await worker.processJob(mockJob);

    expect(scraperSpy).toHaveBeenCalledWith('https://peliculaplay.com/es/detail/active', 1);
    expect(jobsService.finishJob).toHaveBeenCalledWith(
      'job-valid-lease-456',
      expect.any(String),
      'completed',
      1,
      0,
      expect.any(Array)
    );
  });
});
