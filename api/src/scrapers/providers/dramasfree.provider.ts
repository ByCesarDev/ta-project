import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { normalizeServer } from '../serverParsers.js';
import { IStreamProvider } from './base.provider.js';
import { ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../../types/index.js';

import { cloudflareCookieService } from '../../services/cloudflareCookie.service.js';

export const CLUSTER_MIRRORS = [
  'https://www3.dramasfree.com',
  'https://ww1.123flmsfree.com',
  'https://play.cuevana19.com',
  'https://peliculaplay.com',
  'https://ver.123pelicula.com',
  'https://flixlat.com',
  'https://es.cuevana4br.com',
  'https://ww20.321moviesfree.com',
];

export class DramasFreeProvider implements IStreamProvider {
  public readonly name = 'dramasfree';
  public readonly baseUrl: string = CLUSTER_MIRRORS[0];
  public readonly isEnabled = true;
  public lastErrorReason?: string;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
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

  /**
   * Helper to perform GET request across mirror pool with automatic failover and Cloudflare clearance
   */
  private async fetchWithMirrorFailover(path: string): Promise<{ data: any; status: number } | null> {
    const cfHeaders = cloudflareCookieService.getHeaders();
    let got403Count = 0;

    for (const mirror of CLUSTER_MIRRORS) {
      try {
        const url = `${mirror}${path.startsWith('/') ? '' : '/'}${path}`;
        const response = await axios.get(url, {
          timeout: 6000,
          headers: {
            ...cfHeaders,
            Referer: `${mirror}/`,
          },
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && response.data) {
          this.lastErrorReason = undefined;
          return { data: response.data, status: response.status };
        } else if (response.status === 403) {
          got403Count++;
        }
      } catch {
        // Try next mirror in pool
        continue;
      }
    }

    if (got403Count > 0) {
      this.lastErrorReason = '403: Bloqueado por Cloudflare Turnstile (Requiere cookie cf_clearance activa)';
    } else {
      this.lastErrorReason = '404: Ruta no encontrada en los 8 mirrors del cluster';
    }

    return null;
  }

  public async search(query: string): Promise<ScrapedAnimeSummary[]> {
    try {
      const cleanQuery = query.replace(/-/g, ' ').trim();
      const res = await this.fetchWithMirrorFailover(`/buscar?q=${encodeURIComponent(cleanQuery)}`);
      if (!res || res.status !== 200) return [];

      const $ = cheerio.load(res.data);
      const list: ScrapedAnimeSummary[] = [];

      $('div.drama-item, article.post, div.item-content, a[href*="/detail/drama/"]').each((_i, el) => {
        const title = $(el).find('h2, h3, div.title, p.title').first().text().trim() || $(el).attr('title') || '';
        const href = $(el).attr('href') || $(el).find('a').first().attr('href') || '';
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

        if (href && href.includes('/detail/drama/')) {
          const rawSlug = href.replace(/^.*\/detail\/drama\//, '').replace(/^\/+|\/+$/g, '').split('/')[0];
          if (rawSlug) {
            list.push({
              name: title || rawSlug,
              slug: rawSlug,
              img,
            });
          }
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

    // 1. Direct candidate paths
    const candidateSlugs = [dramaSlug, cleanSlug];
    if (fallbackSlug) {
      candidateSlugs.push(fallbackSlug, this.formatSlug(fallbackSlug));
    }

    for (const slug of candidateSlugs) {
      const candidatePaths = [
        `/es/detail/drama/${slug}/${epNum}`,
        `/detail/drama/${slug}/${epNum}`,
        `/es/detail/drama/${slug}`,
        `/detail/drama/${slug}`,
      ];

      for (const path of candidatePaths) {
        const res = await this.fetchWithMirrorFailover(path);
        if (res && res.status === 200 && res.data) {
          const servers = await this.extractFromPageOrDubbing(res.data, epNum, language);
          if (servers.length > 0) {
            return servers;
          }
        }
      }
    }

    // 2. Search cluster catalog if direct paths didn't match
    try {
      const searchQuery = (fallbackSlug || dramaSlug).replace(/-/g, ' ');
      const searchResults = await this.search(searchQuery);

      for (const result of searchResults) {
        if (!result.slug) continue;
        const searchPath = `/es/detail/drama/${result.slug}/${epNum}`;
        const res = await this.fetchWithMirrorFailover(searchPath);
        if (res && res.status === 200 && res.data) {
          const servers = await this.extractFromPageOrDubbing(res.data, epNum, language);
          if (servers.length > 0) {
            return servers;
          }
        }
      }
    } catch {
      // Ignore search error
    }

    return [];
  }

  private async extractFromPageOrDubbing(
    html: string,
    episodeNumber: string,
    targetLanguage: StreamLanguage
  ): Promise<ScrapedServer[]> {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (!nextDataMatch) {
      return this.parseEpisodeHtml(html, targetLanguage);
    }

    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const pageProps = nextData?.props?.pageProps;
      if (!pageProps) return this.parseEpisodeHtml(html, targetLanguage);

      const pageDubMode = String(pageProps.dubMode || '0');
      const isPageDub = pageDubMode === '1' || (pageProps.name || '').toLowerCase().includes('doblaje');
      const currentPageLang: StreamLanguage = isPageDub ? 'dub' : 'sub';

      // If current page matches target language, parse mediaInfoList directly
      if (currentPageLang === targetLanguage) {
        return this.parseMediaInfoList(pageProps.mediaInfoList, targetLanguage);
      }

      // If current page is opposite language, check dubbingList to switch to matching version
      if (Array.isArray(pageProps.dubbingList) && pageProps.dubbingList.length > 0) {
        const targetEntry = pageProps.dubbingList.find((d: any) => {
          if (targetLanguage === 'dub') {
            return String(d.dubMode) === '1' || (d.name || '').toLowerCase().includes('doblaje');
          } else {
            return String(d.dubMode) === '0';
          }
        });

        if (targetEntry?.websiteParam) {
          const targetPath = `/es/detail/drama/${targetEntry.websiteParam}/${episodeNumber}`;
          const targetRes = await this.fetchWithMirrorFailover(targetPath);

          if (targetRes && targetRes.status === 200 && targetRes.data) {
            const targetMatch = targetRes.data.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
            if (targetMatch) {
              const targetNextData = JSON.parse(targetMatch[1]);
              const targetProps = targetNextData?.props?.pageProps;
              if (targetProps?.mediaInfoList) {
                return this.parseMediaInfoList(targetProps.mediaInfoList, targetLanguage);
              }
            }
          }
        }
      }

      // If no alternate dubbing entry found, return current page media list if available
      return this.parseMediaInfoList(pageProps.mediaInfoList, currentPageLang);
    } catch {
      return this.parseEpisodeHtml(html, targetLanguage);
    }
  }

  private parseMediaInfoList(mediaInfoList: any[], language: StreamLanguage): ScrapedServer[] {
    const serversMap = new Map<string, ScrapedServer>();
    if (!Array.isArray(mediaInfoList) || mediaInfoList.length === 0) return [];

    for (const media of mediaInfoList) {
      if (media.mediaUrl) {
        const def = media.currentDefinition || 'GROOT_SD';
        const quality =
          def === 'GROOT_SD'
            ? '720p'
            : def === 'GROOT_LD'
            ? '540p'
            : def === 'GROOT_FD'
            ? '360p'
            : '1080p';
        const priority = def === 'GROOT_SD' ? 10 : def === 'GROOT_LD' ? 20 : def === 'GROOT_FD' ? 30 : 5;

        const server: ScrapedServer = {
          provider: 'dramasfree',
          server_name: `DramasFree (${quality})`,
          embed_url: media.mediaUrl,
          direct_stream_url: media.mediaUrl,
          language,
          quality,
          priority,
          is_active: true,
        };

        const key = `dramasfree_${quality}_${language}`;
        if (!serversMap.has(key)) {
          serversMap.set(key, server);
        }
      }
    }

    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }

  public parseEpisodeHtml(html: string, targetLanguage: StreamLanguage = 'sub'): ScrapedServer[] {
    const serversMap = new Map<string, ScrapedServer>();
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData?.props?.pageProps;
        if (pageProps?.mediaInfoList) {
          const pageDubMode = String(pageProps.dubMode || '0');
          const isPageDub = pageDubMode === '1' || (pageProps.name || '').toLowerCase().includes('doblaje');
          const lang: StreamLanguage = isPageDub ? 'dub' : 'sub';
          return this.parseMediaInfoList(pageProps.mediaInfoList, lang);
        }
      } catch {
        // Fallback
      }
    }

    const $ = cheerio.load(html);
    $('ul.server-list li, div.server-opt, button.btn-server, a.btn-stream').each((_i, el) => {
      const rawUrl = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('href');
      const hint = $(el).text()?.trim() || 'DramasFree Server';
      const textLower = hint.toLowerCase();

      let itemLang: StreamLanguage = targetLanguage;
      if (textLower.includes('lat') || textLower.includes('doblado') || textLower.includes('espanol') || textLower.includes('audio latino')) {
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
            serversMap.set(key, { ...server, language: itemLang });
          }
        }
      }
    });

    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }
}

export const dramasFreeProvider = new DramasFreeProvider();
