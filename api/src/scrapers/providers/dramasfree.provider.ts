import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeServer } from '../serverParsers.js';
import { IStreamProvider } from './base.provider.js';
import {
  ScrapedAnimeSummary,
  ScrapedServer,
  SourcePreviewResult,
  StreamLanguage,
  SubtitleTrack,
  VariantSummary,
} from '../../types/index.js';
import { cloudflareCookieService } from '../../services/cloudflareCookie.service.js';

export const CLUSTER_MIRRORS = [
  'https://peliculaplay.com',
  'https://ver.123pelicula.com',
  'https://es.cuevana4br.com',
  'https://flixlat.com',
  'https://www3.dramasfree.com',
  'https://ww1.123flmsfree.com',
  'https://play.cuevana19.com',
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

/**
 * Normalizes and infers stable audio variant metadata from page props or dubbingList entry
 */
export function parseAudioMetadata(entry: {
  websiteParam?: string;
  name?: string;
  dubLang?: string;
  dubMode?: string | number;
  category?: number;
}): {
  variant_id: string;
  audio_language: string;
  language_label: string;
  is_dub: boolean;
} {
  const variant_id = entry.websiteParam || 'default';
  const name = entry.name || '';
  const nameLower = name.toLowerCase();
  const isDub =
    String(entry.dubMode) === '1' ||
    nameLower.includes('doblaje') ||
    nameLower.includes('latino') ||
    nameLower.includes('español') ||
    nameLower.includes('castellano') ||
    nameLower.includes('english') ||
    nameLower.includes('dub');

  let audio_language = 'und';
  let language_label = name;

  if (entry.dubLang) {
    const dl = entry.dubLang.toLowerCase();
    if (dl === 'es' || dl === 'es-419' || dl === 'lat') {
      audio_language = 'es-419';
      language_label = 'Español Latino';
    } else if (dl === 'es-es' || dl === 'castellano') {
      audio_language = 'es-ES';
      language_label = 'Español (España)';
    } else if (dl === 'en' || dl === 'en-us') {
      audio_language = 'en-US';
      language_label = 'Inglés';
    } else if (dl === 'pt' || dl === 'pt-br') {
      audio_language = 'pt-BR';
      language_label = 'Portugués';
    } else if (dl === 'ja') {
      audio_language = 'ja';
      language_label = 'Japonés (Original)';
    } else {
      audio_language = entry.dubLang;
    }
  }

  if (audio_language === 'und') {
    if (nameLower.includes('latino') || (isDub && (nameLower.includes('español') || nameLower.includes('spanish')))) {
      audio_language = 'es-419';
      language_label = 'Español Latino';
    } else if (nameLower.includes('castellano') || nameLower.includes('españa')) {
      audio_language = 'es-ES';
      language_label = 'Español (España)';
    } else if (nameLower.includes('inglés') || nameLower.includes('english')) {
      audio_language = 'en-US';
      language_label = 'Inglés';
    } else if (nameLower.includes('portugués') || nameLower.includes('portuguese')) {
      audio_language = 'pt-BR';
      language_label = 'Portugués';
    } else if (!isDub || nameLower.includes('japonés') || nameLower.includes('japones') || nameLower.includes('original') || nameLower.includes('sub')) {
      audio_language = 'ja';
      language_label = 'Japonés (Original)';
    }
  }

  return {
    variant_id,
    audio_language,
    language_label: language_label || (isDub ? 'Doblaje' : 'Japonés (Original)'),
    is_dub: isDub,
  };
}

export class DynamicClusterResolver {
  public cache: Map<string, string> = new Map();
  public visitedParams: Set<string> = new Set();
  public seeds: string[] = [
    'fLlJJ08QFlnGTLNPD9uFs-Demon-Slayer-Kimetsu-no-Yaiba',
    'gCt2oc0DFw51NrR5EAVrx-Jujutsu-Kaisen',
    'sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins',
    '8ftPGNE9T3R1OACxVVjTl-Jujutsu-Kaisen-0-The-Movie',
    'zDkeCb59JRZE0yPQZwiSX-Solo-Leveling',
    '4nw3c40KjANLxASvu0cuV-Tougen-Anki',
  ];

  constructor() {
    for (const seed of this.seeds) {
      this.indexParam(seed);
    }
  }

  public normalize(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\[.*?\]/g, '')
      .replace(/temporada\s*\d+/gi, '')
      .replace(/season\s*\d+/gi, '')
      .replace(/2nd\s*season/gi, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public indexParam(param: string, title?: string): void {
    if (!param) return;
    const cleanParam = param.trim();
    const titlePart = cleanParam.replace(/^[a-zA-Z0-9]{20,24}-/, '');
    const normParamTitle = this.normalize(titlePart);
    if (normParamTitle) {
      this.cache.set(normParamTitle, cleanParam);
    }
    if (title) {
      const normTitle = this.normalize(title);
      if (normTitle) {
        this.cache.set(normTitle, cleanParam);
      }
    }
  }

  public harvestPageData(html: string): void {
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (!match) return;
    try {
      const nextData = JSON.parse(match[1]);
      const pp = nextData.props?.pageProps;
      if (!pp) return;

      if (pp.websiteParam) {
        this.indexParam(pp.websiteParam, pp.name);
      }
      if (Array.isArray(pp.seasons)) {
        for (const s of pp.seasons) {
          if (s.websiteParam) this.indexParam(s.websiteParam, s.name);
        }
      }
      if (Array.isArray(pp.refList)) {
        for (const r of pp.refList) {
          if (r.websiteParam) this.indexParam(r.websiteParam, r.name);
        }
      }
      if (Array.isArray(pp.dubbingList)) {
        for (const d of pp.dubbingList) {
          if (d.websiteParam) this.indexParam(d.websiteParam, d.name);
        }
      }
    } catch {
      // Ignore parse error
    }
  }

  public async resolveCandidates(
    candidates: string[],
    fetcher: (param: string) => Promise<string | null>
  ): Promise<string | null> {
    for (const c of candidates) {
      if (!c) continue;
      const hashMatch = c.match(/([a-zA-Z0-9]{20,24}-[a-zA-Z0-9-]+)/);
      if (hashMatch) return hashMatch[1];

      const norm = this.normalize(c);
      if (this.cache.has(norm)) return this.cache.get(norm)!;
    }

    for (const c of candidates) {
      const norm = this.normalize(c);
      if (!norm) continue;
      for (const [key, param] of this.cache.entries()) {
        if (key === norm || key.includes(norm) || norm.includes(key)) {
          return param;
        }
      }
    }

    // Crawl queue
    const queue = [...this.seeds];
    while (queue.length > 0) {
      const p = queue.shift()!;
      if (this.visitedParams.has(p)) continue;
      this.visitedParams.add(p);

      const html = await fetcher(p);
      if (html) {
        this.harvestPageData(html);

        for (const c of candidates) {
          const norm = this.normalize(c);
          if (!norm) continue;
          for (const [key, param] of this.cache.entries()) {
            if (key === norm || key.includes(norm) || norm.includes(key)) {
              return param;
            }
          }
        }
      }
    }

    return null;
  }
}

export const dynamicClusterResolver = new DynamicClusterResolver();

export class DramasFreeProvider implements IStreamProvider {
  public readonly name = 'dramasfree';
  public readonly baseUrl: string = CLUSTER_MIRRORS[0];
  public readonly isEnabled = true;
  public lastErrorReason?: string;
  public lastDiagnostics: string[] = [];

  public formatSlug(slug: string): string {
    if (!slug) return '';
    const urlMatch = slug.match(/\/(?:drama|movie)\/([^\/\?#]+)/);
    const raw = urlMatch ? urlMatch[1] : slug;

    const hashMatch = raw.match(/([a-zA-Z0-9]{20,24}-[a-zA-Z0-9-]+)/);
    if (hashMatch) {
      return hashMatch[1];
    }

    return raw
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
          if (typeof response.data === 'string') {
            dynamicClusterResolver.harvestPageData(response.data);
          }
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

  /**
   * Previews a source without downloading video fragments, discovering all audio variants and published episodes
   */
  public async previewSource(sourceUrlOrParam: string): Promise<SourcePreviewResult | null> {
    if (!sourceUrlOrParam) return null;
    const cleanParam = this.formatSlug(sourceUrlOrParam);
    if (!cleanParam) return null;

    const isMovieUrl = sourceUrlOrParam.includes('/movie/');
    const initialCategory: 'drama' | 'movie' = isMovieUrl ? 'movie' : 'drama';

    const testPaths = [
      `/es/detail/${initialCategory}/${cleanParam}/1`,
      `/es/detail/${initialCategory}/${cleanParam}`,
      `/es/detail/drama/${cleanParam}/1`,
      `/es/detail/movie/${cleanParam}`,
      `/detail/drama/${cleanParam}/1`,
      `/detail/movie/${cleanParam}`,
    ];

    let pageProps: any = null;
    let actualType: 'drama' | 'movie' = initialCategory;

    for (const p of testPaths) {
      const res = await this.fetchWithMirrorFailover(p);
      if (res && res.status === 200 && res.data) {
        const match = typeof res.data === 'string'
          ? res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/)
          : null;
        if (match) {
          try {
            const nextData = JSON.parse(match[1]);
            const pp = nextData?.props?.pageProps;
            if (pp) {
              pageProps = pp;
              actualType = pp.category === 0 ? 'movie' : 'drama';
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!pageProps) return null;

    const title = pageProps.name || pageProps.title || cleanParam;
    const cover_image = pageProps.coverVerticalUrl || pageProps.imageUrl || undefined;

    // Extract real published episodes numbers
    const published_episodes: number[] = [];
    if (actualType === 'movie') {
      published_episodes.push(1);
    } else if (Array.isArray(pageProps.episodeVo) && pageProps.episodeVo.length > 0) {
      for (const e of pageProps.episodeVo) {
        const epNum = Number(e.seriesNo ?? e.episodeNo);
        if (!isNaN(epNum) && !published_episodes.includes(epNum)) {
          published_episodes.push(epNum);
        }
      }
      published_episodes.sort((a, b) => a - b);
    } else if (pageProps.episodeCount && pageProps.episodeCount > 0) {
      for (let i = 1; i <= pageProps.episodeCount; i++) {
        published_episodes.push(i);
      }
    } else {
      published_episodes.push(1);
    }

    // Discover all variants: Base version + dubbingList
    const variants: VariantSummary[] = [];
    const seenVariants = new Set<string>();

    // 1. Root / Current Page Variant
    const rootMeta = parseAudioMetadata({
      websiteParam: pageProps.websiteParam || cleanParam,
      name: pageProps.name,
      dubLang: pageProps.dubLang,
      dubMode: pageProps.dubMode,
      category: pageProps.category,
    });
    seenVariants.add(rootMeta.variant_id);
    variants.push({
      variant_id: rootMeta.variant_id,
      name: pageProps.name || title,
      audio_language: rootMeta.audio_language,
      language_label: rootMeta.language_label,
      category: pageProps.category,
      website_param: rootMeta.variant_id,
      episodes_count: published_episodes.length,
      is_dub: rootMeta.is_dub,
    });

    // 2. All variants in dubbingList
    if (Array.isArray(pageProps.dubbingList)) {
      for (const d of pageProps.dubbingList) {
        const param = d.websiteParam || d.paramIds || d.id;
        if (param && !seenVariants.has(param)) {
          seenVariants.add(param);
          const meta = parseAudioMetadata({
            websiteParam: param,
            name: d.name,
            dubLang: d.dubLang,
            dubMode: d.dubMode,
            category: d.category,
          });
          variants.push({
            variant_id: meta.variant_id,
            name: d.name || meta.language_label,
            audio_language: meta.audio_language,
            language_label: meta.language_label,
            category: d.category,
            website_param: param,
            episodes_count: d.episodeCount || published_episodes.length,
            is_dub: meta.is_dub,
          });
        }
      }
    }

    return {
      source_url: sourceUrlOrParam,
      source_id: cleanParam,
      title,
      cover_image,
      total_episodes_found: published_episodes.length,
      published_episodes,
      variants,
      category_name: actualType,
    };
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

  /**
   * Scrapes all available audio versions for a specific episode concurrently
   */
  public async getAllEpisodeServers(
    sourceUrlOrParam: string,
    episodeNumber: number | string
  ): Promise<ScrapedServer[]> {
    const preview = await this.previewSource(sourceUrlOrParam);
    if (!preview || preview.variants.length === 0) {
      return this.getEpisodeServers(sourceUrlOrParam, episodeNumber);
    }

    const allServers: ScrapedServer[] = [];
    const epNum = Number(episodeNumber);
    const category = preview.category_name;

    const variantPromises = preview.variants.map(async (variant) => {
      try {
        const epPath =
          category === 'movie'
            ? `/es/detail/movie/${variant.website_param}`
            : `/es/detail/drama/${variant.website_param}/${epNum}`;

        const res = await this.fetchWithMirrorFailover(epPath);
        if (!res || res.status !== 200 || !res.data) return [];

        const match = typeof res.data === 'string'
          ? res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/)
          : null;
        if (!match) return [];

        const nextData = JSON.parse(match[1]);
        const pageProps = nextData?.props?.pageProps;
        if (!pageProps || !Array.isArray(pageProps.mediaInfoList)) return [];

        // Extract subtitles strictly confirmed for this episode
        const subList = this.extractSubtitlesStrict(pageProps, epNum);
        return this.parseMediaInfoList(
          pageProps.mediaInfoList,
          variant.is_dub ? 'dub' : 'sub',
          subList,
          variant.variant_id,
          variant.audio_language,
          variant.language_label
        );
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(variantPromises);
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        allServers.push(...r.value);
      }
    }

    return allServers;
  }

  public async getEpisodeServers(
    dramaSlug: string,
    episodeNumber: number | string,
    language: StreamLanguage = 'sub',
    fallbackSlug?: string
  ): Promise<ScrapedServer[]> {
    const cleanSlug = this.formatSlug(dramaSlug);
    const epNum = String(episodeNumber).trim();

    const candidates = [
      dramaSlug,
      cleanSlug,
      fallbackSlug,
      fallbackSlug ? this.formatSlug(fallbackSlug) : undefined,
    ].filter(Boolean) as string[];

    const resolvedParam = await dynamicClusterResolver.resolveCandidates(candidates, async (param) => {
      const res = await this.fetchWithMirrorFailover(`/es/detail/drama/${param}/1`);
      return res && typeof res.data === 'string' ? res.data : null;
    });

    const candidateSlugs: string[] = [];
    if (resolvedParam) candidateSlugs.push(resolvedParam);
    if (!candidateSlugs.includes(cleanSlug)) candidateSlugs.push(cleanSlug);
    if (!candidateSlugs.includes(dramaSlug)) candidateSlugs.push(dramaSlug);
    if (fallbackSlug) {
      const cleanFallback = this.formatSlug(fallbackSlug);
      if (!candidateSlugs.includes(cleanFallback)) candidateSlugs.push(cleanFallback);
      if (!candidateSlugs.includes(fallbackSlug)) candidateSlugs.push(fallbackSlug);
    }

    for (const slug of candidateSlugs) {
      const candidatePaths = [
        `/es/detail/drama/${slug}/${epNum}`,
        `/detail/drama/${slug}/${epNum}`,
        `/es/detail/movie/${slug}`,
        `/detail/movie/${slug}`,
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

      const epNum = parseInt(episodeNumber, 10);
      const rootMeta = parseAudioMetadata({
        websiteParam: pageProps.websiteParam,
        name: pageProps.name,
        dubLang: pageProps.dubLang,
        dubMode: pageProps.dubMode,
        category: pageProps.category,
      });

      const currentPageLang: StreamLanguage = rootMeta.is_dub ? 'dub' : 'sub';
      const subList = this.extractSubtitlesStrict(pageProps, epNum);

      if (currentPageLang === targetLanguage && Array.isArray(pageProps.mediaInfoList) && pageProps.mediaInfoList.length > 0) {
        return this.parseMediaInfoList(
          pageProps.mediaInfoList,
          targetLanguage,
          subList,
          rootMeta.variant_id,
          rootMeta.audio_language,
          rootMeta.language_label
        );
      }

      // Check dubbingList for matching target language
      if (Array.isArray(pageProps.dubbingList) && pageProps.dubbingList.length > 0) {
        const targetEntry = pageProps.dubbingList.find((d: any) => {
          const meta = parseAudioMetadata(d);
          return targetLanguage === 'dub' ? meta.is_dub : !meta.is_dub;
        });

        if (targetEntry?.websiteParam) {
          const type = targetEntry.category === 0 ? 'movie' : 'drama';
          const targetPath =
            type === 'movie'
              ? `/es/detail/movie/${targetEntry.websiteParam}`
              : `/es/detail/drama/${targetEntry.websiteParam}/${episodeNumber}`;
          const targetRes = await this.fetchWithMirrorFailover(targetPath);

          if (targetRes && targetRes.status === 200 && targetRes.data) {
            const targetMatch = targetRes.data.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
            if (targetMatch) {
              const targetNextData = JSON.parse(targetMatch[1]);
              const targetProps = targetNextData?.props?.pageProps;
              if (targetProps?.mediaInfoList && targetProps.mediaInfoList.length > 0) {
                const targetSubs = this.extractSubtitlesStrict(targetProps, epNum);
                const targetMeta = parseAudioMetadata({
                  websiteParam: targetProps.websiteParam || targetEntry.websiteParam,
                  name: targetProps.name,
                  dubLang: targetProps.dubLang,
                  dubMode: targetProps.dubMode,
                });
                return this.parseMediaInfoList(
                  targetProps.mediaInfoList,
                  targetLanguage,
                  targetSubs.length > 0 ? targetSubs : subList,
                  targetMeta.variant_id,
                  targetMeta.audio_language,
                  targetMeta.language_label
                );
              }
            }
          }
        }
      }

      // Fallback
      return this.parseMediaInfoList(
        pageProps.mediaInfoList,
        currentPageLang,
        subList,
        rootMeta.variant_id,
        rootMeta.audio_language,
        rootMeta.language_label
      );
    } catch {
      return this.parseEpisodeHtml(html, targetLanguage);
    }
  }

  /**
   * Strictly extracts subtitle tracks for the exact episode without unconfirmed fallbacks
   */
  private extractSubtitlesStrict(pageProps: any, epNum: number): SubtitleTrack[] {
    if (!pageProps) return [];
    let rawSubs: any[] = [];

    // 1. Check matching episode in episodeVo
    if (Array.isArray(pageProps.episodeVo)) {
      const match = pageProps.episodeVo.find((e: any) => Number(e.episodeNo) === epNum || Number(e.seriesNo) === epNum);
      if (match && Array.isArray(match.subtitlingList)) {
        rawSubs = match.subtitlingList;
      }
    }

    // 2. If movie or confirmed single episode page, check root subtitlingList
    if (rawSubs.length === 0 && (pageProps.category === 0 || Number(pageProps.currentEpisodeNo) === epNum)) {
      if (Array.isArray(pageProps.subtitlingList)) {
        rawSubs = pageProps.subtitlingList;
      }
    }

    const subList: SubtitleTrack[] = [];
    for (const sub of rawSubs) {
      if (sub && sub.subtitlingUrl) {
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

  private parseMediaInfoList(
    mediaInfoList: any[],
    language: StreamLanguage,
    subList: SubtitleTrack[] = [],
    audio_variant: string = 'default',
    audio_language: string = 'und',
    language_label?: string
  ): ScrapedServer[] {
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
        const displayLabel = language_label ? `${language_label} ` : '';

        const server: ScrapedServer = {
          provider: 'dramasfree',
          server_name: `DramasFree (${displayLabel}${quality})`,
          embed_url: `${media.mediaUrl}${subHash}`,
          direct_stream_url: `${media.mediaUrl}${subHash}`,
          language,
          audio_variant,
          audio_language,
          language_label,
          source_key: def,
          quality,
          priority,
          is_active: true,
          subtitles: subList.length > 0 ? subList : undefined,
        };

        const key = `dramasfree_${audio_variant}_${def}_${quality}`;
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
          const rootMeta = parseAudioMetadata({
            websiteParam: pageProps.websiteParam,
            name: pageProps.name,
            dubLang: pageProps.dubLang,
            dubMode: pageProps.dubMode,
          });
          const lang: StreamLanguage = rootMeta.is_dub ? 'dub' : 'sub';
          const subs = this.extractSubtitlesStrict(pageProps, 1);
          return this.parseMediaInfoList(
            pageProps.mediaInfoList,
            lang,
            subs,
            rootMeta.variant_id,
            rootMeta.audio_language,
            rootMeta.language_label
          );
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
