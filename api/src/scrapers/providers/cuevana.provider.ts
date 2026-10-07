import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { normalizeServer } from '../serverParsers.js';
import { IStreamProvider } from './base.provider.js';
import { ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../../types/index.js';

export class CuevanaProvider implements IStreamProvider {
  public readonly name = 'cuevana19';
  public readonly baseUrl: string = 'https://play.cuevana19.com';
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
        Referer: 'https://play.cuevana19.com/',
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
      const response = await this.client.get(`/search?q=${encodeURIComponent(query)}`, {
        validateStatus: (status) => status < 500,
      });
      if (response.status !== 200) return [];
      
      const $ = cheerio.load(response.data);
      const list: ScrapedAnimeSummary[] = [];

      $('article.item, div.post-item, div.TPost').each((_i, el) => {
        const title = $(el).find('h2.Title, h3.Title, div.Title').first().text().trim();
        const href = $(el).find('a').first().attr('href') || '';
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

        if (title && href) {
          const slug = href.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+|\/+$/g, '');
          list.push({
            name: title,
            slug: slug || this.formatSlug(title),
            img,
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
    language: StreamLanguage = 'sub',
    fallbackSlug?: string
  ): Promise<ScrapedServer[]> {
    const cleanSlug = this.formatSlug(animeSlug);
    const epNum = String(episodeNumber).trim();

    // Cuevana commonly uses /serie/[slug]/temporada/1/episodio/[num] or /episodio/[slug]-[num]
    const candidatePaths = [
      `/serie/${cleanSlug}/temporada/1/episodio/${epNum}`,
      `/episodio/${cleanSlug}-${epNum}`,
      `/ver/${cleanSlug}-episodio-${epNum}`,
      `/${cleanSlug}-temporada-1-episodio-${epNum}`,
    ];

    for (const path of candidatePaths) {
      try {
        const response = await this.client.get(path, {
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && response.data) {
          const servers = this.parseEpisodeHtml(response.data, language);
          if (servers.length > 0) {
            return servers;
          }
        }
      } catch {
        // Try next candidate
      }
    }

    if (fallbackSlug && this.formatSlug(fallbackSlug) !== cleanSlug) {
      return this.getEpisodeServers(fallbackSlug, episodeNumber, language);
    }

    return [];
  }

  public parseEpisodeHtml(html: string, targetLanguage: StreamLanguage = 'sub'): ScrapedServer[] {
    const $ = cheerio.load(html);
    const serversMap = new Map<string, ScrapedServer>();

    // 1. Parse player tabs with data-url / data-server and language markers (LAT, SUB, ESP)
    $('li[data-url], div[data-url], a[data-url], button[data-url], ul.TPlayerNv li').each((_i, el) => {
      const rawUrl = $(el).attr('data-url') || $(el).attr('data-src') || $(el).attr('data-link');
      const serverHint = $(el).text()?.trim() || $(el).attr('data-server') || 'Cuevana Server';
      const textLower = $(el).text()?.toLowerCase() || '';

      // Determine language
      let itemLang: StreamLanguage = targetLanguage;
      if (textLower.includes('lat') || textLower.includes('doblaje') || textLower.includes('espanol')) {
        itemLang = 'dub';
      } else if (textLower.includes('sub') || textLower.includes('jap') || textLower.includes('ingles')) {
        itemLang = 'sub';
      }

      if (rawUrl) {
        let finalUrl = rawUrl;
        if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
        const server = normalizeServer(finalUrl, serverHint, itemLang);
        if (server) {
          const key = `${server.provider}_${server.embed_url}_${itemLang}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    });

    // 2. Parse inline player configuration scripts
    $('script').each((_i, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.includes('player_sources') || scriptContent.includes('players =') || scriptContent.includes('sources =')) {
        const matches = scriptContent.match(/https?:\/\/[^"'\s<>]+\.(?:m3u8|mp4|php)[^"'\s<>]*/g);
        if (matches) {
          for (const url of matches) {
            const server = normalizeServer(url, 'Cuevana Stream', targetLanguage);
            if (server) {
              const key = `${server.provider}_${server.embed_url}_${targetLanguage}`;
              if (!serversMap.has(key)) {
                serversMap.set(key, server);
              }
            }
          }
        }
      }
    });

    // 3. Fallback: Standard direct iframes
    $('iframe').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        let finalSrc = src;
        if (finalSrc.startsWith('//')) finalSrc = `https:${finalSrc}`;
        const server = normalizeServer(finalSrc, 'Cuevana Embed', targetLanguage);
        if (server) {
          const key = `${server.provider}_${server.embed_url}_${targetLanguage}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    });

    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }
}

export const cuevanaProvider = new CuevanaProvider();
