import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { normalizeServer } from '../serverParsers.js';
import { IStreamProvider } from './base.provider.js';
import { ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../../types/index.js';

export class DramasFreeProvider implements IStreamProvider {
  public readonly name = 'dramasfree';
  public readonly baseUrl: string = 'https://www3.dramasfree.com';
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
        Referer: 'https://www3.dramasfree.com/',
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
      const response = await this.client.get(`/buscar?q=${encodeURIComponent(query)}`, {
        validateStatus: (status) => status < 500,
      });
      if (response.status !== 200) return [];

      const $ = cheerio.load(response.data);
      const list: ScrapedAnimeSummary[] = [];

      $('div.drama-item, article.post, div.item-content').each((_i, el) => {
        const title = $(el).find('h2, h3, div.title').first().text().trim();
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
    dramaSlug: string,
    episodeNumber: number | string,
    language: StreamLanguage = 'sub',
    fallbackSlug?: string
  ): Promise<ScrapedServer[]> {
    const cleanSlug = this.formatSlug(dramaSlug);
    const epNum = String(episodeNumber).trim();

    const candidatePaths = [
      `/ver/${cleanSlug}-episodio-${epNum}`,
      `/drama/${cleanSlug}/episodio-${epNum}`,
      `/${cleanSlug}-capitulo-${epNum}`,
      `/ver/${cleanSlug}-capitulo-${epNum}`,
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
        // Continue to next path candidate
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

    // 1. Parse server options with data-src / data-server / embed URLs
    $('ul.server-list li, div.server-opt, button.btn-server, a.btn-stream').each((_i, el) => {
      const rawUrl = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('href');
      const hint = $(el).text()?.trim() || 'DramasFree Server';
      const textLower = hint.toLowerCase();

      let itemLang: StreamLanguage = targetLanguage;
      if (textLower.includes('lat') || textLower.includes('doblado') || textLower.includes('espanol')) {
        itemLang = 'dub';
      } else if (textLower.includes('sub') || textLower.includes('coreano') || textLower.includes('jap')) {
        itemLang = 'sub';
      }

      if (rawUrl && !rawUrl.startsWith('#') && !rawUrl.startsWith('javascript:')) {
        let finalUrl = rawUrl;
        if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
        const server = normalizeServer(finalUrl, hint, itemLang);
        if (server) {
          const key = `${server.provider}_${server.embed_url}_${itemLang}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    });

    // 2. Parse direct iframes
    $('iframe').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        let finalSrc = src;
        if (finalSrc.startsWith('//')) finalSrc = `https:${finalSrc}`;
        const server = normalizeServer(finalSrc, 'DramasFree Embed', targetLanguage);
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

export const dramasFreeProvider = new DramasFreeProvider();
