import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { env } from '../config/env.js';
import { normalizeServer } from './serverParsers.js';
import { ScrapedAnimeDetails, ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../types/index.js';

export class VideoScraperService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = env.SCRAPER_BASE_URL) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });
  }

  /**
   * Generates a clean URL slug according to convention
   */
  public formatSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Scrapes servers and embed links for a specific anime episode
   */
  public async scrapeEpisodeServers(
    animeSlug: string,
    episodeNumber: number | string,
    language: StreamLanguage = 'sub'
  ): Promise<ScrapedServer[]> {
    const cleanSlug = this.formatSlug(animeSlug);
    const epNum = String(episodeNumber).trim();

    // Specific slug rewrite rule if needed
    const resolvedSlug = cleanSlug === 'go-toubun-no-hanayome' ? 'go-toubun-no-hanayome' : cleanSlug;
    const path = `ver/${resolvedSlug}-${epNum}`;

    try {
      const response = await this.client.get(path, {
        validateStatus: (status) => status < 500,
      });

      if (response.status === 404) {
        // Try alternate URL format: "${resolvedSlug}-episodio-${epNum}-sub-espanol"
        const altPath = `${resolvedSlug}-episodio-${epNum}-sub-espanol`;
        const altResponse = await this.client.get(altPath, {
          validateStatus: (status) => status < 500,
        });

        if (altResponse.status === 200) {
          return this.parseEpisodeHtml(altResponse.data, language);
        }

        return [];
      }

      if (response.status !== 200) {
        return [];
      }

      return this.parseEpisodeHtml(response.data, language);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown scraper error';
      console.warn(`[VideoScraperService] Warning scraping ${path}:`, message);
      return [];
    }
  }

  /**
   * Parses episode HTML extracting embed links from Base64 select options or inline scripts
   */
  public parseEpisodeHtml(html: string, language: StreamLanguage = 'sub'): ScrapedServer[] {
    const $ = cheerio.load(html);
    const serversMap = new Map<string, ScrapedServer>();

    // 1. Parse select options containing Base64 encoded iframes (standard theme)
    $('div.mobius select option, select#select-servers option, select.server-select option').each(
      (_i, el) => {
        const val = $(el).attr('value');
        const hintName = $(el).text()?.trim();

        if (val) {
          try {
            const decoded = Buffer.from(val, 'base64').toString('utf-8');
            const match = decoded.match(/src=["']([^"']+)["']/i);
            const rawUrl = match ? match[1] : null;

            if (rawUrl) {
              const server = normalizeServer(rawUrl, hintName, language);
              if (server) {
                const key = `${server.provider}_${server.embed_url}`;
                if (!serversMap.has(key)) {
                  serversMap.set(key, server);
                }
              }
            }
          } catch {
            // If not base64, check if value itself is a URL
            const server = normalizeServer(val, hintName, language);
            if (server) {
              const key = `${server.provider}_${server.embed_url}`;
              if (!serversMap.has(key)) {
                serversMap.set(key, server);
              }
            }
          }
        }
      }
    );

    // 2. Parse inline JavaScript variables (e.g. var videos = [[...]];)
    $('script').each((_i, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.includes('videos =') || scriptContent.includes('var videos =')) {
        try {
          const match = scriptContent.match(/var\s+videos\s*=\s*(\[[^;]+\]);/);
          if (match && match[1]) {
            const parsedVideos = JSON.parse(match[1]);
            if (Array.isArray(parsedVideos)) {
              for (const item of parsedVideos) {
                // item can be [serverName, codeOrUrl, type, ...] or { server, code, url }
                let rawUrl = '';
                let serverName = '';

                if (Array.isArray(item)) {
                  serverName = String(item[0] || '');
                  rawUrl = String(item[1] || '');
                } else if (typeof item === 'object' && item !== null) {
                  serverName = item.server || item.title || '';
                  rawUrl = item.code || item.url || '';
                }

                if (rawUrl) {
                  const server = normalizeServer(rawUrl, serverName, language);
                  if (server) {
                    const key = `${server.provider}_${server.embed_url}`;
                    if (!serversMap.has(key)) {
                      serversMap.set(key, server);
                    }
                  }
                }
              }
            }
          }
        } catch {
          // Ignore JSON parse errors in dynamic scripts
        }
      }
    });

    // 3. Fallback: Parse direct iframes
    $('iframe').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        const server = normalizeServer(src, undefined, language);
        if (server) {
          const key = `${server.provider}_${server.embed_url}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    });

    // Convert map values to array and sort by priority ascending
    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Scrapes paginated anime list
   */
  public async scrapeAnimeList(page: number = 1): Promise<ScrapedAnimeSummary[]> {
    try {
      const response = await this.client.get(`anime?page=${page}&status=&type=&order=`);
      if (response.status !== 200) return [];

      const $ = cheerio.load(response.data);
      const list: ScrapedAnimeSummary[] = [];

      $('div.listupd article.bs, ul.animes li.anime, article.anime').each((_i, el) => {
        const titleEl = $(el).find('div > a > div.tt > h2, h3.title, h2.title');
        const rawName = titleEl.text().trim();
        const linkHref = $(el).find('a').attr('href') || '';
        const imgUrl = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        const dubbing = $(el).find('span.sb, span.type').text().trim();

        if (rawName) {
          // Extract slug from href
          let slug = linkHref.replace(this.baseUrl, '').replace(/^\/+|\/+$/g, '');
          if (slug.startsWith('anime/')) {
            slug = slug.replace('anime/', '');
          }
          if (!slug) {
            slug = this.formatSlug(rawName);
          }

          list.push({
            name: rawName,
            slug,
            img: imgUrl,
            dubbing: dubbing || undefined,
          });
        }
      });

      return list;
    } catch (error: unknown) {
      console.error('[VideoScraperService] Failed to scrape anime list:', error);
      return [];
    }
  }

  /**
   * Scrapes detailed information for a specific anime
   */
  public async scrapeAnimeDetails(animeSlug: string): Promise<ScrapedAnimeDetails | null> {
    const cleanSlug = this.formatSlug(animeSlug);
    try {
      const response = await this.client.get(`anime/${cleanSlug}`, {
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) return null;

      const $ = cheerio.load(response.data);
      const name = $('h1.title, div.infox h1, h1').first().text().trim();
      if (!name) return null;

      const genres: string[] = [];
      $('div.genxed a, div.genres a, p.genres a').each((_i, el) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });

      const description = $('div.entry-content p, div.sinopsis, p.sinopsis').first().text().trim();
      const cover_image = $('div.thumb img, div.poster img').attr('src');
      const banner_image = $('div.bigcover img, div.banner img').attr('src');

      const information: Record<string, string> = {};
      $('div.spe span, div.info-content p').each((_i, el) => {
        const text = $(el).text().trim();
        const parts = text.split(':');
        if (parts.length >= 2) {
          const key = parts[0]?.trim().toLowerCase() || '';
          const val = parts.slice(1).join(':').trim();
          if (key && val) information[key] = val;
        }
      });

      return {
        name,
        slug: cleanSlug,
        description: description || 'Sin descripción disponible.',
        genres,
        information,
        cover_image,
        banner_image,
        status: information['estado'] || information['status'],
      };
    } catch (error: unknown) {
      console.error(`[VideoScraperService] Failed to scrape anime details for ${cleanSlug}:`, error);
      return null;
    }
  }
}

export const videoScraper = new VideoScraperService();
