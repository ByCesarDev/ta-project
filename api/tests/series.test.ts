import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seriesService } from '../src/services/series.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

vi.mock('../src/config/supabaseAdmin.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

describe('SeriesService - Clean Architecture & Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate clean URL-friendly slugs without accents or special characters', () => {
      const slug1 = seriesService.generateSlug('Demon Slayer: Kimetsu no Yaiba - Hashira Training Arc');
      expect(slug1).toBe('demon-slayer-kimetsu-no-yaiba-hashira-training-arc');

      const slug2 = seriesService.generateSlug('¡Shingeki no Kyojin: The Final Season — Kanketsu-hen!');
      expect(slug2).toBe('shingeki-no-kyojin-the-final-season-kanketsu-hen');

      const slug3 = seriesService.generateSlug('Tate no Yūsha no Nariagari Season 3');
      expect(slug3).toBe('tate-no-yusha-no-nariagari-season-3');
    });
  });

  describe('deleteSeries (ON DELETE RESTRICT enforcement)', () => {
    it('should throw an error and reject deletion if series contains linked seasons', async () => {
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 2, data: null, error: null }),
        }),
      });

      await expect(seriesService.deleteSeries(10)).rejects.toThrow(
        'No se puede eliminar la serie porque aún contiene temporadas vinculadas.'
      );
    });
  });

  describe('deleteSeason', () => {
    it('should throw an error if cascade is false and season contains linked anime entries', async () => {
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 1, data: null, error: null }),
        }),
      });

      await expect(seriesService.deleteSeason(5, false)).rejects.toThrow(
        'No se puede eliminar la temporada porque aún tiene entregas vinculadas.'
      );
    });

    it('should delete linked entries and season when cascade is true', async () => {
      (supabaseAdmin.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await seriesService.deleteSeason(5, true);
      expect(result).toBe(true);
    });
  });

  describe('combineSeries', () => {
    it('should reject merging a series into itself', async () => {
      await expect(seriesService.combineSeries(1, 1)).rejects.toThrow(
        'No se puede combinar una serie con ella misma'
      );
    });
  });
});
