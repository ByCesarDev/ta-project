import { describe, it, expect, vi } from 'vitest';
import { ytdlpExtractorService } from '../src/services/ytdlpExtractor.service.js';

describe('YtDlpExtractorService', () => {
  it('should reject invalid or SSRF URLs immediately', async () => {
    const localhostRes = await ytdlpExtractorService.extract('http://localhost:8080/stream.mp4');
    expect(localhostRes.success).toBe(false);
    expect(localhostRes.reason).toBeDefined();

    const loopbackRes = await ytdlpExtractorService.extract('http://127.0.0.1:3000/video');
    expect(loopbackRes.success).toBe(false);

    const malformedRes = await ytdlpExtractorService.extract('not-a-url');
    expect(malformedRes.success).toBe(false);
  });

  it('should correctly parse deleted video markers from yt-dlp metadata', () => {
    const serviceAny = ytdlpExtractorService as any;

    const deadOutput = {
      id: 'novideo',
      title: 'novideo.mp4',
      url: 'https://www.yourupload.com/embed/novideo.mp4',
    };

    const parsed = serviceAny.parseYtDlpOutput(deadOutput, 'https://www.yourupload.com/embed/test');
    expect(parsed.success).toBe(false);
    expect(parsed.dead).toBe(true);
    expect(parsed.reason).toContain('eliminado');
  });

  it('should format proxy stream URL when anti-hotlink Referer headers are present', () => {
    const serviceAny = ytdlpExtractorService as any;

    const mp4Output = {
      id: 'video123',
      title: 'Episode 1',
      url: 'https://cdn.upstream-video.org/video.mp4',
      ext: 'mp4',
      http_headers: {
        Referer: 'https://upstream-video.org/',
      },
    };

    const parsed = serviceAny.parseYtDlpOutput(mp4Output, 'https://upstream-video.org/embed/video123');
    expect(parsed.success).toBe(true);
    expect(parsed.type).toBe('mp4');
    expect(parsed.url).toContain('/api/v1/stream/proxy?url=');
    expect(parsed.url).toContain(encodeURIComponent('https://cdn.upstream-video.org/video.mp4'));
    expect(parsed.url).toContain(encodeURIComponent('https://upstream-video.org/'));
  });

  it('should detect HLS manifest from formats array', () => {
    const serviceAny = ytdlpExtractorService as any;

    const hlsOutput = {
      id: 'hls123',
      title: 'Episode 1 HLS',
      formats: [
        {
          format_id: 'hls-1080p',
          protocol: 'm3u8_native',
          url: 'https://cdn.upstream-video.org/hls/master.m3u8',
        },
      ],
      http_headers: {},
    };

    const parsed = serviceAny.parseYtDlpOutput(hlsOutput, 'https://upstream-video.org/embed/hls123');
    expect(parsed.success).toBe(true);
    expect(parsed.type).toBe('hls');
    expect(parsed.direct_url).toBe('https://cdn.upstream-video.org/hls/master.m3u8');
  });
});
