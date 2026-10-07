import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { normalizeServer } from '../serverParsers.js';
import { IStreamProvider } from './base.provider.js';
import { ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../../types/index.js';

export class SoloLatinoProvider implements IStreamProvider {
  public readonly name = 'solo-latino';
  public readonly baseUrl: string = 'https://latino.solo-latino.com';
  public readonly isEnabled = true;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        Referer: 'https://latino.solo-latino.com/',
      },
    });
  }

  public formatSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public async search(query: string): Promise<ScrapedAnimeSummary[]> {
    try {
      const response = await this.client.get(`/?s=${encodeURIComponent(query)}`, {
        validateStatus: (status) => status < 500,
      });
      if (response.status !== 200) return [];

      const $ = cheerio.load(response.data);
      const list: ScrapedAnimeSummary[] = [];

      $('article.item, div.result-item, div.poster').each((_i, el) => {
        const title = $(el).find('h2.title, h3.title, div.title, a').first().text().trim();
        const href = $(el).find('a').first().attr('href') || '';
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

        if (title && href) {
          const slug = href.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+|\/+$/g, '');
          list.push({
            name: title,
            slug: slug || this.formatSlug(title),
            img,
            dubbing: 'Latino',
          });
        }
      });

      return list;
    } catch {
      return [];
    }
  }

  public async getEpisodeServers(
    animeSlug: string,
    episodeNumber: number | string,
    _language: StreamLanguage = 'dub',
    fallbackSlug?: string
  ): Promise<ScrapedServer[]> {
    const cleanSlug = this.formatSlug(animeSlug);
    const epNum = String(episodeNumber).trim();

    // SoloLatino routes
    const candidatePaths = [
      `/episodios/${cleanSlug}-1x${epNum}`,
      `/episodios/${cleanSlug}-episodio-${epNum}`,
      `/ver/${cleanSlug}-1x${epNum}`,
      `/${cleanSlug}-temporada-1-capitulo-${epNum}`,
    ];

    for (const path of candidatePaths) {
      try {
        const response = await this.client.get(path, {
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && response.data) {
          const servers = this.parseEpisodeHtml(response.data);
          if (servers.length > 0) {
            return servers;
          }
        }
      } catch {
        // Continue
      }
    }

    if (fallbackSlug && this.formatSlug(fallbackSlug) !== cleanSlug) {
      return this.getEpisodeServers(fallbackSlug, episodeNumber, 'dub');
    }

    return [];
  }

  public parseEpisodeHtml(html: string): ScrapedServer[] {
    const $ = cheerio.load(html);
    const serversMap = new Map<string, ScrapedServer>();

    // Solo-Latino is 100% Spanish Latino dubbing
    const language: StreamLanguage = 'dub';

    // 1. Parse player iframe tabs with data-src
    $('ul#playeroptionsul li, div.player-item, button.btn-opt, a.source-item').each((_i, el) => {
      const rawUrl = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('href');
      const hint = $(el).text()?.trim() || 'SoloLatino Server';

      if (rawUrl && !rawUrl.startsWith('#') && !rawUrl.startsWith('javascript:')) {
        let finalUrl = rawUrl;
        if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
        const server = normalizeServer(finalUrl, hint, language);
        if (server) {
          const key = `${server.provider}_${server.embed_url}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    });

    // 2. Fallback: Parse direct iframes
    $('iframe').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        let finalSrc = src;
        if (finalSrc.startsWith('//')) finalSrc = `https:${finalSrc}`;
        const server = normalizeServer(finalSrc, 'SoloLatino Embed', language);
        if (server) {
          const key = `${server.provider}_${server.embed_url}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    });

    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }
}

export const soloLatinoProvider = new SoloLatinoProvider();
