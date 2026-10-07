import { describe, it, expect, vi } from 'vitest';
import { streamResolverService } from '../src/services/streamResolver.service.js';

describe('StreamResolverService & Direct Stream Extraction', () => {
  it('should return direct HLS stream immediately if direct_stream_url is provided', async () => {
    const result = await streamResolverService.resolveSource({
      id: 101,
      provider: 'filemoon',
      server_name: 'FileMoon',
      embed_url: 'https://filemoon.sx/e/example123',
      direct_stream_url: 'https://cdn.filemoon.sx/master.m3u8',
      quality: '1080p',
      language: 'sub',
    });

    expect(result.type).toBe('hls');
    expect(result.url).toBe('https://cdn.filemoon.sx/master.m3u8');
    expect(result.is_fallback).toBeUndefined();
  });

  it('should detect .m3u8 directly inside embed_url', async () => {
    const result = await streamResolverService.resolveSource({
      id: 102,
      provider: 'custom',
      server_name: 'Custom Server',
      embed_url: 'https://streams.totalanime.com/hls/ep1/index.m3u8',
      quality: '720p',
    });

    expect(result.type).toBe('hls');
    expect(result.url).toBe('https://streams.totalanime.com/hls/ep1/index.m3u8');
  });

  it('should detect .mp4 directly inside embed_url', async () => {
    const result = await streamResolverService.resolveSource({
      id: 103,
      provider: 'custom',
      server_name: 'Direct MP4',
      embed_url: 'https://cdn.totalanime.com/episodes/solo-leveling-ep1.mp4',
    });

    expect(result.type).toBe('mp4');
    expect(result.url).toBe('https://cdn.totalanime.com/episodes/solo-leveling-ep1.mp4');
  });

  it('should fallback gracefully to iframe if host does not allow direct scraping or fails', async () => {
    const result = await streamResolverService.resolveSource({
      id: 104,
      provider: 'mega',
      server_name: 'Mega',
      embed_url: 'https://mega.nz/embed/!abc123xyz',
    });

    expect(result.type).toBe('iframe');
    expect(result.url).toBe('https://mega.nz/embed/!abc123xyz');
    expect(result.is_fallback).toBe(true);
  });
});
