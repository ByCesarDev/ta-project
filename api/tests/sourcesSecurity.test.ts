import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamController } from '../src/controllers/stream.controller.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';
import { videoScraper } from '../src/scrapers/videoScraper.service.js';
import { AuthenticatedRequest } from '../src/types/index.js';
import { Response } from 'express';

describe('Episode Sources Hardening, Public Quarantine Protection & Availability Sync', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockReq = {
      params: {},
      body: {},
      query: {},
      user: {
        id: 'mod-uuid-1',
        role: 'moderator',
        status: 'active',
      },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('POST /api/v1/stream/validate-source', () => {
    it('should reject SSRF attempts with 400 Bad Request', async () => {
      mockReq.body = { embed_url: 'http://169.254.169.254/latest/meta-data' };

      await streamController.validateSource(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'InvalidUrl' })
      );
    });

    it('should identify known providers and mark them as active/non-quarantined', async () => {
      mockReq.body = { embed_url: 'https://mega.nz/embed/sample-key' };

      await streamController.validateSource(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          is_known_provider: true,
          is_quarantined: false,
        })
      );
    });

    it('should flag unknown providers and mark them as quarantined', async () => {
      mockReq.body = { embed_url: 'https://unverified-cdn.info/player/12345' };

      await streamController.validateSource(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          is_known_provider: false,
          is_quarantined: true,
        })
      );
    });
  });

  describe('PUT /api/v1/stream/episodes/:episodeId/sources', () => {
    it('should forbid non-admins from permanently deleting sources', async () => {
      mockReq.params = { episodeId: '100' };
      mockReq.body = { sources: [], deleted_ids: [1, 2] };
      mockReq.user = { id: 'mod-1', role: 'moderator', status: 'active' };

      await streamController.upsertEpisodeSources(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Forbidden' })
      );
    });

    it('should automatically quarantine unverified providers added by staff without active status', async () => {
      mockReq.params = { episodeId: '100' };
      mockReq.user = { id: 'mod-1', role: 'moderator', status: 'active' };
      mockReq.body = {
        sources: [
          {
            embed_url: 'https://unverified-player.org/e/abc',
            provider: 'custom',
            server_name: 'Custom Server',
            language: 'sub',
            quality: '1080p',
            priority: 10,
            is_active: true, // Moderator tries to activate unknown host directly
          },
        ],
      };

      let upsertPayload: any = null;
      vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
        if (table === 'episode_sources') {
          return {
            upsert: (payload: any) => {
              upsertPayload = payload;
              return {
                select: async () => ({ data: payload, error: null }),
              };
            },
            select: () => ({
              eq: () => ({
                eq: async () => ({ count: 0, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'episodes') {
          return {
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      await streamController.upsertEpisodeSources(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(upsertPayload).toBeDefined();
      // Brand new unverified host must be forced to is_active = false for moderators
      expect(upsertPayload[0].is_active).toBe(false);
    });
  });

  describe('GET /api/v1/stream/:animeSlug/:episodeNumber Quarantine & Availability Protection', () => {
    it('should never leak quarantined sources to public client and persist with is_active = false', async () => {
      mockReq.params = { animeSlug: 'solo-leveling', episodeNumber: '1' };

      const upsertedPayloads: any[] = [];
      // DB returns anime and episode row, but no cached sources
      vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
        if (table === 'animes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 1, name: 'Solo Leveling', slug: 'solo-leveling' }, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'episodes') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: 50 }, error: null }),
                }),
              }),
            }),
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          } as any;
        }
        if (table === 'episode_sources') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    order: async () => ({ data: [], error: null }), // no cache
                  }),
                }),
              }),
            }),
            upsert: (payload: any) => {
              upsertedPayloads.push(payload);
              return Promise.resolve({ error: null });
            },
          } as any;
        }
        return {} as any;
      });

      // Live scraper returns 1 verified server and 1 quarantined server
      const mixedScrapedServers = [
        {
          provider: 'mega',
          server_name: 'Mega',
          embed_url: 'https://mega.nz/embed/verified123',
          language: 'sub' as const,
          quality: '1080p',
          priority: 10,
          is_active: true,
        },
        {
          provider: 'unknown-cdn',
          server_name: 'Unknown CDN',
          embed_url: 'https://quarantined-host.net/embed/456',
          language: 'sub' as const,
          quality: '720p',
          priority: 100,
          is_active: false, // QUARANTINED!
        },
      ];

      vi.spyOn(videoScraper, 'scrapeEpisodeServers').mockResolvedValueOnce(mixedScrapedServers);

      await streamController.getStreamSources(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonResponse = (mockRes.json as any).mock.calls[0][0];

      // Public response MUST ONLY contain the verified server
      expect(jsonResponse.servers).toHaveLength(1);
      expect(jsonResponse.servers[0].provider).toBe('mega');
      expect(jsonResponse.servers.some((s: any) => s.is_active === false)).toBe(false);

      // Verify DB persistence respected is_active flag for each server
      expect(upsertedPayloads).toHaveLength(2);
      expect(upsertedPayloads.find((p) => p.provider === 'mega')?.is_active).toBe(true);
      expect(upsertedPayloads.find((p) => p.provider === 'unknown-cdn')?.is_active).toBe(false);
    });

    it('should return 404 when live scraper only discovers quarantined servers', async () => {
      mockReq.params = { animeSlug: 'solo-leveling', episodeNumber: '2' };

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

      const onlyQuarantinedServers = [
        {
          provider: 'suspicious-cdn',
          server_name: 'Suspicious',
          embed_url: 'https://unverified-host.net/embed/999',
          language: 'sub' as const,
          quality: '720p',
          priority: 100,
          is_active: false,
        },
      ];

      vi.spyOn(videoScraper, 'scrapeEpisodeServers').mockResolvedValueOnce(onlyQuarantinedServers);

      await streamController.getStreamSources(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      const jsonResponse = (mockRes.json as any).mock.calls[0][0];
      expect(jsonResponse.servers).toHaveLength(0);
    });
  });

  describe('syncEpisodeAvailability', () => {
    it('should mark episode as available when active sources count > 0', async () => {
      let updatedStatus: string | null = null;
      vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
        if (table === 'episode_sources') {
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({ count: 3, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'episodes') {
          return {
            update: (payload: any) => {
              updatedStatus = payload.status;
              return {
                eq: async () => ({ error: null }),
              };
            },
          } as any;
        }
        return {} as any;
      });

      const result = await streamController.syncEpisodeAvailability(42);

      expect(result).toBe('available');
      expect(updatedStatus).toBe('available');
    });

    it('should mark episode as pending when active sources count === 0', async () => {
      let updatedStatus: string | null = null;
      vi.spyOn(supabaseAdmin, 'from').mockImplementation((table: string) => {
        if (table === 'episode_sources') {
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({ count: 0, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'episodes') {
          return {
            update: (payload: any) => {
              updatedStatus = payload.status;
              return {
                eq: async () => ({ error: null }),
              };
            },
          } as any;
        }
        return {} as any;
      });

      const result = await streamController.syncEpisodeAvailability(42);

      expect(result).toBe('pending');
      expect(updatedStatus).toBe('pending');
    });
  });
});
