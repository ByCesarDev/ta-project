import { describe, it, expect, vi, beforeEach } from 'vitest';
import { thumbnailService } from '../src/services/thumbnail.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

vi.mock('../src/config/supabaseAdmin.js', () => {
  return {
    supabaseAdmin: {
      storage: {
        from: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe('ThumbnailService - Frame Extraction & Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRandomTimestamp', () => {
    it('should calculate a valid timestamp format HH:MM:SS', () => {
      const ts = thumbnailService.getRandomTimestamp(1440);
      expect(ts).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should default to middle 3-8 minutes when duration is undefined', () => {
      const ts = thumbnailService.getRandomTimestamp();
      expect(ts).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      const [h, m] = ts.split(':').map(Number);
      expect(h).toBe(0);
      expect(m).toBeGreaterThanOrEqual(3);
      expect(m).toBeLessThanOrEqual(8);
    });
  });

  describe('generateEpisodeThumbnail', () => {
    it('should fail gracefully when episode has no active sources', async () => {
      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === 'episodes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 10, episode_number: 1, duration: 1440, animes: { slug: 'naruto' } },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'episode_sources') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await thumbnailService.generateEpisodeThumbnail(10);
      expect(res.success).toBe(false);
      expect(res.error).toContain('No hay servidores de video activos');
    });
  });
});
