import { describe, it, expect, vi, beforeEach } from 'vitest';
import { animeService } from '../src/services/anime.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

vi.mock('../src/config/supabaseAdmin.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
    },
  };
});

describe('AnimeService - Management & Listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate valid URL slugs without accents or special characters', () => {
      const slug = animeService.generateSlug('Nanatsu no Taizai: Imashime no Fukkatsu!');
      expect(slug).toBe('nanatsu-no-taizai-imashime-no-fukkatsu');

      const slug2 = animeService.generateSlug('Bleach: Sennen Kessen-hen — Ketsubetsu-tan');
      expect(slug2).toBe('bleach-sennen-kessen-hen-ketsubetsu-tan');
    });
  });

  describe('listAnimes', () => {
    it('should list and enrich animes with episodes and genres', async () => {
      const mockAnimes = [
        {
          id: 1,
          name: 'Solo Leveling',
          slug: 'solo-leveling',
          status: 'emision',
          episodes: 12,
          episodes_list: [{ id: 101 }, { id: 102 }],
          anime_genres: [{ genres: { id: 1, name: 'Acción', slug: 'accion' } }],
          series_entries: [{ series_seasons: { series: { id: 9, name: 'Solo Leveling Series', slug: 'solo-leveling-series' } } }],
        },
      ];

      const chain: any = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockAnimes, error: null, count: 1 }),
      };

      (supabaseAdmin.from as any).mockReturnValue(chain);

      const result = await animeService.listAnimes({ page: 1, limit: 10, search: 'Solo', status: 'emision' });

      expect(supabaseAdmin.from).toHaveBeenCalledWith('animes');
      expect(result.total).toBe(1);
      expect(result.animes).toHaveLength(1);
      expect(result.animes[0].name).toBe('Solo Leveling');
      expect(result.animes[0].episodes).toBe(12);
      expect(result.animes[0].db_episodes_count).toBe(2);
      expect(result.animes[0].genres).toHaveLength(1);
      expect(result.animes[0].parent_series?.name).toBe('Solo Leveling Series');
    });
  });

  describe('createAnime', () => {
    it('should throw error when name is empty', async () => {
      await expect(animeService.createAnime({ name: '' })).rejects.toThrow('El nombre del anime es obligatorio.');
    });

    it('should insert anime with generated slug if not provided', async () => {
      const insertedRow = {
        id: 20,
        name: 'Chainsaw Man Season 2',
        slug: 'chainsaw-man-season-2',
        status: 'proximamente',
      };

      (supabaseAdmin.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: insertedRow, error: null }),
          }),
        }),
      });

      const res = await animeService.createAnime({
        name: 'Chainsaw Man Season 2',
        status: 'proximamente',
      });

      expect(res.slug).toBe('chainsaw-man-season-2');
    });
  });
});
