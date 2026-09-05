import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobsService } from '../src/services/jobs.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

describe('JobsService Queue Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a new scrape job with pending status', async () => {
    const mockCreatedJob = {
      id: 'job-uuid-12345',
      anime_id: 1,
      status: 'pending',
      total_episodes: 12,
      processed_episodes: 0,
      failed_episodes: 0,
      error_log: [],
      requested_by: 'user-admin-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(supabaseAdmin, 'from').mockReturnValueOnce({
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: mockCreatedJob,
            error: null,
          }),
        }),
      }),
    } as any);

    const job = await jobsService.createJob(1, 'user-admin-id', 12);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-uuid-12345');
    expect(job.status).toBe('pending');
    expect(job.total_episodes).toBe(12);
  });

  it('should atomically claim the next pending job via RPC', async () => {
    const claimedJob = {
      id: 'job-uuid-999',
      anime_id: 2,
      status: 'processing',
      total_episodes: 24,
      locked_by: 'worker-1',
    };

    vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
      data: [claimedJob],
      error: null,
    } as any);

    const job = await jobsService.claimNextPendingJob('worker-1');

    expect(job).not.toBeNull();
    expect(job?.id).toBe('job-uuid-999');
    expect(job?.status).toBe('processing');
    expect(job?.locked_by).toBe('worker-1');
  });

  it('should fallback gracefully to resilient query-and-update if RPC fails', async () => {
    const pendingJob = {
      id: 'job-uuid-888',
      anime_id: 3,
      status: 'pending',
      total_episodes: 12,
      attempts: 0,
    };

    const claimedJob = {
      ...pendingJob,
      status: 'processing',
      locked_by: 'worker-2',
      attempts: 1,
    };

    // RPC fails
    vi.spyOn(supabaseAdmin, 'rpc').mockRejectedValueOnce(new Error('RPC function missing'));

    // Zombie recovery update -> select pending -> claim update
    let updateCount = 0;
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => ({
      update: () => {
        updateCount++;
        if (updateCount === 1) {
          // Zombie recovery update
          return {
            eq: () => ({
              lt: async () => ({ error: null }),
            }),
          };
        }
        // Claim update
        return {
          eq: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: claimedJob,
                  error: null,
                }),
              }),
            }),
          }),
        };
      },
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: [pendingJob],
              error: null,
            }),
          }),
        }),
      }),
    }) as any);

    const job = await jobsService.claimNextPendingJob('worker-2');

    expect(job).not.toBeNull();
    expect(job?.id).toBe('job-uuid-888');
    expect(job?.status).toBe('processing');
  });

  it('should update job progress and finish job', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: async () => ({ error: null }),
    });

    vi.spyOn(supabaseAdmin, 'from').mockReturnValue({
      update: updateSpy,
    } as any);

    await jobsService.updateProgress('job-123', 5, 1, [{ episode_number: 6, error: 'Not found', timestamp: '' }]);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        processed_episodes: 5,
        failed_episodes: 1,
      })
    );

    await jobsService.finishJob('job-123', 'completed', 10, 1, []);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        processed_episodes: 10,
        failed_episodes: 1,
      })
    );
  });
});
