import { describe, it, expect } from 'vitest';
import { cuevanaProvider } from '../src/scrapers/providers/cuevana.provider.js';
import { dramasFreeProvider } from '../src/scrapers/providers/dramasfree.provider.js';
import { soloLatinoProvider } from '../src/scrapers/providers/soloLatino.provider.js';
import { videoScraper } from '../src/scrapers/videoScraper.service.js';

describe('Multi-Provider Streaming Scrapers', () => {
  describe('CuevanaProvider', () => {
    it('should parse multi-audio tabs (LAT and SUB) from Cuevana HTML', () => {
      const mockCuevanaHtml = `
        <ul class="TPlayerNv">
          <li data-url="https://streamwish.to/e/cuevana_lat_1" data-server="StreamWish">Audio Latino</li>
          <li data-url="https://filemoon.sx/e/cuevana_sub_1" data-server="FileMoon">Subtitulado</li>
        </ul>
      `;

      const servers = cuevanaProvider.parseEpisodeHtml(mockCuevanaHtml, 'sub');
      expect(servers.length).toBe(2);

      const latServer = servers.find((s) => s.embed_url.includes('cuevana_lat_1'));
      expect(latServer).toBeDefined();
      expect(latServer?.language).toBe('dub');

      const subServer = servers.find((s) => s.embed_url.includes('cuevana_sub_1'));
      expect(subServer).toBeDefined();
      expect(subServer?.language).toBe('sub');
    });
  });

  describe('DramasFreeProvider', () => {
    it('should parse drama servers with language identification from HTML', () => {
      const mockDramasHtml = `
        <ul class="server-list">
          <li data-src="https://ok.ru/videoembed/123456789">Servidor OK.ru (Sub Coreano)</li>
          <li data-src="https://mp4upload.com/embed-987654.html">Mp4Upload (Audio Latino)</li>
        </ul>
      `;

      const servers = dramasFreeProvider.parseEpisodeHtml(mockDramasHtml, 'sub');
      expect(servers.length).toBe(2);

      const okru = servers.find((s) => s.provider === 'okru');
      expect(okru).toBeDefined();
      expect(okru?.language).toBe('sub');

      const mp4upload = servers.find((s) => s.provider === 'mp4upload');
      expect(mp4upload).toBeDefined();
      expect(mp4upload?.language).toBe('dub');
    });

    it('should parse direct HLS streams and detect audio from __NEXT_DATA__ payload', () => {
      const mockNextHtml = `
        <html>
          <head></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "name": "[Doblaje Español]Los Siete Pecados Capitales Temporada 1",
                    "paramIds": "sNA1hjhxFcJpD4ZwSK9En",
                    "dubMode": "1",
                    "subtitleLang": "es",
                    "mediaInfoList": [
                      { "currentDefinition": "GROOT_SD", "mediaUrl": "https://vs7z.dramasfree.com/video-sd.m3u8" },
                      { "currentDefinition": "GROOT_LD", "mediaUrl": "https://vs7z.dramasfree.com/video-ld.m3u8" }
                    ]
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const servers = dramasFreeProvider.parseEpisodeHtml(mockNextHtml, 'dub');
      expect(servers.length).toBe(2);
      expect(servers.every((s) => s.provider === 'dramasfree')).toBe(true);
      expect(servers.every((s) => s.language === 'dub')).toBe(true);

      const sdServer = servers.find((s) => s.quality === '720p');
      expect(sdServer).toBeDefined();
      expect(sdServer?.embed_url).toBe('https://vs7z.dramasfree.com/video-sd.m3u8');
      expect(sdServer?.direct_stream_url).toBe('https://vs7z.dramasfree.com/video-sd.m3u8');
    });
  });

  describe('SoloLatinoProvider', () => {
    it('should assign dub language to all extracted servers', () => {
      const mockSoloLatinoHtml = `
        <ul id="playeroptionsul">
          <li data-src="https://filemoon.sx/e/solo_latino_99">FileMoon HD</li>
          <li data-src="https://streamwish.to/e/solo_latino_88">StreamWish</li>
        </ul>
      `;

      const servers = soloLatinoProvider.parseEpisodeHtml(mockSoloLatinoHtml);
      expect(servers.length).toBe(2);
      expect(servers.every((s) => s.language === 'dub')).toBe(true);
    });
  });

  describe('VideoScraperService Multi-Provider Orchestrator', () => {
    it('should format slugs cleanly', () => {
      expect(videoScraper.formatSlug('Solo Leveling: Season 2')).toBe('solo-leveling-season-2');
      expect(videoScraper.formatSlug('  Kimetsu no Yaiba  ')).toBe('kimetsu-no-yaiba');
    });
  });
});
