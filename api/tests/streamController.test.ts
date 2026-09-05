import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamController } from '../src/controllers/stream.controller.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';
import { videoScraper } from '../src/scrapers/videoScraper.service.js';
import { Request, Response } from 'express';

describe('Stream Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockReq = {
      params: { animeSlug: 'tougen-anki', episodeNumber: '1' },
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should return 400 if animeSlug or episodeNumber are missing', async () => {
    mockReq.params = { animeSlug: '', episodeNumber: '' };

    await streamController.getStreamSources(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should return cached sources from database when available', async () => {
    const mockAnime = { id: 10, name: 'Tougen Anki', slug: 'tougen-anki' };
    const mockEpisode = { id: 2040 };
    const mockSources = [
      {
        id: 1,
        provider: 'mega',
        server_name: 'Mega',
        embed_url: 'https://mega.nz/embed/abc',
        language: 'sub',
        quality: '1080p',
        priority: 10,
      },
    ];

    let queryCount = 0;
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => {
      queryCount++;
      if (queryCount === 1) {
        // animes query
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockAnime, error: null }),
            }),
          }),
        } as any;
      } else if (queryCount === 2) {
        // episodes query
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: mockEpisode, error: null }),
              }),
            }),
          }),
        } as any;
      } else {
        // episode_sources query
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  order: async () => ({ data: mockSources, error: null }),
                }),
              }),
            }),
          }),
        } as any;
      }
    });

    await streamController.getStreamSources(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'cache',
        episode_number: 1,
        servers: mockSources,
      })
    );
  });

  it('should fall back to live scraper when no sources exist in database', async () => {
    // DB returns no sources
    vi.spyOn(supabaseAdmin, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          eq: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    } as any);

    const scrapedMock = [
      {
        provider: 'streamwish',
        server_name: 'StreamWish',
        embed_url: 'https://streamwish.to/e/test',
        language: 'sub' as const,
        quality: '720p',
        priority: 20,
      },
    ];

    vi.spyOn(videoScraper, 'scrapeEpisodeServers').mockResolvedValueOnce(scrapedMock);

    await streamController.getStreamSources(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'live_scraped',
        servers: scrapedMock,
      })
    );
  });
});
