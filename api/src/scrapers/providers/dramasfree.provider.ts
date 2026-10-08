import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeServer } from '../serverParsers.js';
import { IStreamProvider } from './base.provider.js';
import { ScrapedAnimeSummary, ScrapedServer, StreamLanguage, SubtitleTrack } from '../../types/index.js';
import { cloudflareCookieService } from '../../services/cloudflareCookie.service.js';

export const CLUSTER_MIRRORS = [
  'https://flixlat.com',
  'https://www3.dramasfree.com',
  'https://ww1.123flmsfree.com',
  'https://play.cuevana19.com',
  'https://peliculaplay.com',
  'https://ver.123pelicula.com',
  'https://es.cuevana4br.com',
  'https://ww20.321moviesfree.com',
];

export const DRAMASFREE_MOBILE_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14; 22101316G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
  'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  'Sec-Ch-Ua-Mobile': '?1',
  'Sec-Ch-Ua-Platform': '"Android"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export const KNOWN_SLUG_MAP: Record<string, string> = {
  'the-seven-deadly-sins': 'sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins',
  'nanatsu-no-taizai': 'sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins',
  'solo-leveling': 'zDkeCb59JRZE0yPQZwiSX-Solo-Leveling',
  'solo-leveling-season-2': 'KEtkF3W58YdmhQbbe4KSo-Solo-Leveling-Season-2-Arise-from-the-Shadow',
  'solo-leveling-arise-from-the-shadow': 'KEtkF3W58YdmhQbbe4KSo-Solo-Leveling-Season-2-Arise-from-the-Shadow',
};

export class DramasFreeProvider implements IStreamProvider {
  public readonly name = 'dramasfree';
  public readonly baseUrl: string = CLUSTER_MIRRORS[0];
  public readonly isEnabled = true;
  public lastErrorReason?: string;
  public lastDiagnostics: string[] = [];

  public formatSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper to perform GET request across mirror pool with automatic failover and mobile client headers
   */
  public async fetchWithMirrorFailover(path: string): Promise<{ data: any; status: number; mirror: string } | null> {
    const clearance = cloudflareCookieService.getClearance();
    this.lastDiagnostics = [];

    const requestHeaders: Record<string, string> = {
      ...DRAMASFREE_MOBILE_HEADERS,
      ...(clearance?.cookie ? { Cookie: `cf_clearance=${clearance.cookie}` } : {}),
    };

    for (const mirror of CLUSTER_MIRRORS) {
      try {
        const url = `${mirror}${path.startsWith('/') ? '' : '/'}${path}`;
        const response = await axios.get(url, {
          timeout: 8000,
          headers: {
            ...requestHeaders,
            Referer: `${mirror}/`,
          },
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && response.data) {
          this.lastErrorReason = undefined;
          this.lastDiagnostics.push(`[200 OK] ${mirror}`);
          return { data: response.data, status: response.status, mirror };
        } else {
          this.lastDiagnostics.push(`[${response.status}] ${mirror}`);
        }
      } catch (err: any) {
        this.lastDiagnostics.push(`[ERR] ${mirror}: ${err.message}`);
      }
    }

    this.lastErrorReason = `Sin respuesta válida en los espejos (${this.lastDiagnostics.join(', ')})`;
    return null;
  }

  public async search(query: string): Promise<ScrapedAnimeSummary[]> {
    try {
      const cleanQuery = query.replace(/-/g, ' ').trim();
      const res = await this.fetchWithMirrorFailover(`/es/search?q=${encodeURIComponent(cleanQuery)}`);
      if (!res || res.status !== 200) return [];

      const list: ScrapedAnimeSummary[] = [];
      const match = typeof res.data === 'string'
        ? res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)
        : null;

      if (match) {
        try {
          const nextData = JSON.parse(match[1]);
          const results = nextData.props?.pageProps?.dramaList || nextData.props?.pageProps?.list || nextData.props?.pageProps?.searchRes || [];
          for (const item of results) {
            const param = item.websiteParam || item.paramIds || item.id;
            if (param) {
              list.push({
                name: item.name || item.title || param,
                slug: param,
                img: item.coverVerticalUrl || item.imageUrl,
              });
            }
          }
        } catch {
          // Ignore JSON parse error
        }
      }

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

    // 1. Resolve candidate slugs using KNOWN_SLUG_MAP and fallback parameters
    const candidateSlugs: string[] = [];

    const mapped = KNOWN_SLUG_MAP[cleanSlug] || (fallbackSlug ? KNOWN_SLUG_MAP[this.formatSlug(fallbackSlug)] : undefined);
    if (mapped) candidateSlugs.push(mapped);

    if (!candidateSlugs.includes(dramaSlug)) candidateSlugs.push(dramaSlug);
    if (!candidateSlugs.includes(cleanSlug)) candidateSlugs.push(cleanSlug);
    if (fallbackSlug) {
      const cleanFallback = this.formatSlug(fallbackSlug);
      if (!candidateSlugs.includes(fallbackSlug)) candidateSlugs.push(fallbackSlug);
      if (!candidateSlugs.includes(cleanFallback)) candidateSlugs.push(cleanFallback);
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

      // Extract subtitle tracks for this episode
      const subList = this.extractSubtitlesFromProps(pageProps, episodeNumber);

      // If current page matches target language, parse mediaInfoList directly
      if (currentPageLang === targetLanguage && Array.isArray(pageProps.mediaInfoList) && pageProps.mediaInfoList.length > 0) {
        return this.parseMediaInfoList(pageProps.mediaInfoList, targetLanguage, subList);
      }

      // If current page is opposite language, check dubbingList to switch to matching version
      if (Array.isArray(pageProps.dubbingList) && pageProps.dubbingList.length > 0) {
        const targetEntry = pageProps.dubbingList.find((d: any) => {
          if (targetLanguage === 'dub') {
            return String(d.dubMode) === '1' || d.dubLang === 'es' || (d.name || '').toLowerCase().includes('doblaje');
          } else {
            return String(d.dubMode) === '0' && (!d.dubLang || d.dubLang === 'ja');
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
              if (targetProps?.mediaInfoList && targetProps.mediaInfoList.length > 0) {
                const targetSubs = this.extractSubtitlesFromProps(targetProps, episodeNumber);
                return this.parseMediaInfoList(targetProps.mediaInfoList, targetLanguage, targetSubs.length > 0 ? targetSubs : subList);
              }
            }
          }
        }
      }

      // Fallback to current page media list if available
      return this.parseMediaInfoList(pageProps.mediaInfoList, currentPageLang, subList);
    } catch {
      return this.parseEpisodeHtml(html, targetLanguage);
    }
  }

  private extractSubtitlesFromProps(pageProps: any, episodeNumber: string): SubtitleTrack[] {
    if (!pageProps) return [];
    const epNum = parseInt(episodeNumber, 10);
    const targetEpVo = Array.isArray(pageProps.episodeVo)
      ? pageProps.episodeVo.find((e: any) => e.episodeNo === epNum || e.seriesNo === epNum) || pageProps.episodeVo[0]
      : null;
    const rawSubs = targetEpVo?.subtitlingList || pageProps.subtitlingList || [];
    if (!Array.isArray(rawSubs)) return [];

    const subList: SubtitleTrack[] = [];
    for (const sub of rawSubs) {
      if (sub.subtitlingUrl) {
        subList.push({
          id: sub.languageAbbr || sub.language?.toLowerCase() || 'und',
          language: sub.languageAbbr || 'und',
          label: sub.language || sub.languageAbbr || 'Subtítulo',
          url: sub.subtitlingUrl,
        });
      }
    }
    return subList;
  }

  private parseMediaInfoList(mediaInfoList: any[], language: StreamLanguage, subList: SubtitleTrack[] = []): ScrapedServer[] {
    const serversMap = new Map<string, ScrapedServer>();
    if (!Array.isArray(mediaInfoList) || mediaInfoList.length === 0) return [];

    const subHash = subList.length > 0 ? `#subtitles=${encodeURIComponent(JSON.stringify(subList))}` : '';

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
          embed_url: `${media.mediaUrl}${subHash}`,
          direct_stream_url: `${media.mediaUrl}${subHash}`,
          language,
          quality,
          priority,
          is_active: true,
          subtitles: subList.length > 0 ? subList : undefined,
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
          const subs = this.extractSubtitlesFromProps(pageProps, '1');
          return this.parseMediaInfoList(pageProps.mediaInfoList, lang, subs);
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
