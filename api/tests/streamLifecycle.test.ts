import { describe, it, expect, vi } from 'vitest';
import { checkStreamUrlExpiration, isSourceStale } from '../src/utils/streamExpiration.js';
import { streamResolverService } from '../src/services/streamResolver.service.js';

describe('Stream URL Lifecycle & Freshness', () => {
  describe('checkStreamUrlExpiration', () => {
    it('should detect a valid future expiration timestamp in exp parameter', () => {
      const futureUnixSec = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const url = `https://cdn.example.com/stream.m3u8?auth_token=abc&exp=${futureUnixSec}`;

      const result = checkStreamUrlExpiration(url);
      expect(result.isExpired).toBe(false);
      expect(result.expiresAtMs).toBe(futureUnixSec * 1000);
    });

    it('should detect an expired timestamp in exp parameter', () => {
      const pastUnixSec = Math.floor(Date.now() / 1000) - 120; // 2 minutes ago
      const url = `https://cdn.example.com/stream.m3u8?token=xyz&exp=${pastUnixSec}`;

      const result = checkStreamUrlExpiration(url);
      expect(result.isExpired).toBe(true);
      expect(result.reason).toContain('exp');
    });

    it('should flag URLs within safety margin as expired to prevent playback cutoffs', () => {
      const nearFutureUnixSec = Math.floor(Date.now() / 1000) + 30; // 30s in future, within 60s margin
      const url = `https://cdn.example.com/stream.m3u8?expires=${nearFutureUnixSec}`;

      const result = checkStreamUrlExpiration(url, 60_000);
      expect(result.isExpired).toBe(true);
    });

    it('should support millisecond timestamps in expires parameter', () => {
      const futureMs = Date.now() + 10_000_000;
      const url = `https://cdn.example.com/stream.m3u8?token=123&expiry=${futureMs}`;

      const result = checkStreamUrlExpiration(url);
      expect(result.isExpired).toBe(false);
      expect(result.expiresAtMs).toBe(futureMs);
    });

    it('should return isExpired false for URLs without expiration query params', () => {
      const url = 'https://cdn.example.com/stream.m3u8';
      const result = checkStreamUrlExpiration(url);
      expect(result.isExpired).toBe(false);
      expect(result.expiresAtMs).toBeUndefined();
    });
  });

  describe('isSourceStale', () => {
    it('should return false for recently verified sources', () => {
      const recent = new Date(Date.now() - 2 * 3600 * 1000).toISOString(); // 2h ago
      expect(isSourceStale(recent, 24)).toBe(false);
    });

    it('should return true for sources older than threshold', () => {
      const old = new Date(Date.now() - 25 * 3600 * 1000).toISOString(); // 25h ago
      expect(isSourceStale(old, 24)).toBe(true);
    });

    it('should return true when lastVerifiedAt is missing', () => {
      expect(isSourceStale(null)).toBe(true);
      expect(isSourceStale(undefined)).toBe(true);
    });
  });

  describe('StreamResolverService re-resolution on expiration', () => {
    it('should reuse valid direct_stream_url when not expired and forceRefresh is false', async () => {
      const futureUnixSec = Math.floor(Date.now() / 1000) + 7200;
      const direct = `https://cdn.example.com/master.m3u8?exp=${futureUnixSec}`;

      const result = await streamResolverService.resolveSource({
        id: 991,
        provider: 'peliculaplay',
        server_name: 'Peliculaplay',
        embed_url: 'https://peliculaplay.com/embed/123',
        direct_stream_url: direct,
        quality: '1080p',
      });

      expect(result.url).toBe(direct);
      expect(result.type).toBe('hls');
    });

    it('should not reuse expired direct_stream_url and instead trigger re-extraction', async () => {
      const pastUnixSec = Math.floor(Date.now() / 1000) - 3600;
      const expiredDirect = `https://cdn.example.com/master.m3u8?exp=${pastUnixSec}`;

      // Mock live extraction on the resolver service
      const extractSpy = vi.spyOn(streamResolverService as any, 'extractFromHost').mockResolvedValueOnce({
        success: true,
        type: 'hls',
        url: 'https://cdn.example.com/fresh-token.m3u8?exp=9999999999',
      });

      const result = await streamResolverService.resolveSource({
        id: 992,
        provider: 'peliculaplay',
        server_name: 'Peliculaplay',
        embed_url: 'https://peliculaplay.com/embed/123',
        direct_stream_url: expiredDirect,
        quality: '1080p',
      });

      expect(extractSpy).toHaveBeenCalled();
      expect(result.url).toBe('https://cdn.example.com/fresh-token.m3u8?exp=9999999999');

      extractSpy.mockRestore();
    });

    it('should force re-extraction if forceRefresh option is provided even if url has not expired', async () => {
      const futureUnixSec = Math.floor(Date.now() / 1000) + 7200;
      const unexpiredDirect = `https://cdn.example.com/master.m3u8?exp=${futureUnixSec}`;

      const extractSpy = vi.spyOn(streamResolverService as any, 'extractFromHost').mockResolvedValueOnce({
        success: true,
        type: 'hls',
        url: 'https://cdn.example.com/forced-fresh.m3u8',
      });

      const result = await streamResolverService.resolveSource(
        {
          id: 993,
          provider: 'peliculaplay',
          server_name: 'Peliculaplay',
          embed_url: 'https://peliculaplay.com/embed/123',
          direct_stream_url: unexpiredDirect,
          quality: '1080p',
        },
        { forceRefresh: true }
      );

      expect(extractSpy).toHaveBeenCalled();
      expect(result.url).toBe('https://cdn.example.com/forced-fresh.m3u8');

      extractSpy.mockRestore();
    });
  });
});

