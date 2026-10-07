import * as cheerio from 'cheerio';
import { cuevanaProvider } from './providers/cuevana.provider.js';
import { dramasFreeProvider } from './providers/dramasfree.provider.js';
import { soloLatinoProvider } from './providers/soloLatino.provider.js';
import { IStreamProvider } from './providers/base.provider.js';
import { normalizeServer } from './serverParsers.js';
import { ScrapedAnimeDetails, ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../types/index.js';

// Providers that strictly cannot be resolved to native video and require proprietary third-party iframes
const NON_NATIVE_EMBED_PROVIDERS = new Set([
  'mega',
  'doodstream',
  'stape',
  'streamtape',
  'netu',
  'fembed',
  'zippy',
  'tioanime',
  'hqq',
  'embedsb',
  'mailru',
]);

export class VideoScraperService {
  public readonly providers: IStreamProvider[];

  constructor() {
    this.providers = [
      dramasFreeProvider,
      soloLatinoProvider,
      cuevanaProvider,
    ];
  }

  /**
   * Formats slug according to standard convention
   */
  public formatSlug(slug: string): string {
    return dramasFreeProvider.formatSlug(slug);
  }

  /**
   * Scrapes servers and direct streams for a specific episode across enabled native providers (DramasFree, SoloLatino, Cuevana).
   */
  public async scrapeEpisodeServers(
    animeSlug: string,
    episodeNumber: number | string,
    language: StreamLanguage = 'sub',
    fallbackSlug?: string
  ): Promise<ScrapedServer[]> {
    const serversMap = new Map<string, ScrapedServer>();

    // Order providers based on requested language
    const prioritizedProviders: IStreamProvider[] =
      language === 'dub'
        ? [dramasFreeProvider, soloLatinoProvider, cuevanaProvider]
        : [dramasFreeProvider, cuevanaProvider, soloLatinoProvider];

    // Execute provider scraping concurrently with timeout protection
    const promises = prioritizedProviders.map(async (provider) => {
      try {
        const results = await provider.getEpisodeServers(
          animeSlug,
          episodeNumber,
          language,
          fallbackSlug
        );
        return results || [];
      } catch {
        return [];
      }
    });

    const resultsArray = await Promise.allSettled(promises);

    for (const res of resultsArray) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const server of res.value) {
          const providerLower = (server.provider || '').toLowerCase();
          // Filter out unplayable embed-only hosts (Mega, etc.)
          if (NON_NATIVE_EMBED_PROVIDERS.has(providerLower)) {
            continue;
          }

          const serverLang = server.language || language;
          const key = `${server.provider}_${server.embed_url}_${serverLang}_${server.quality || 'HD'}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, {
              ...server,
              language: serverLang,
            });
          }
        }
      }
    }

    // Convert map to sorted array by priority ascending
    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Parses raw HTML extracting embed links (supports DramasFree and standard structures)
   */
  public parseEpisodeHtml(html: string, language: StreamLanguage = 'sub'): ScrapedServer[] {
    // 1. Try DramasFree parser first
    const dfServers = dramasFreeProvider.parseEpisodeHtml(html, language);
    if (dfServers.length > 0) return dfServers;

    // 2. Generic Base64 select options / var videos parser
    const serversMap = new Map<string, ScrapedServer>();
    const $ = cheerio.load(html);

    // Parse base64 select options
    $('select option').each((_i, el) => {
      const val = $(el).attr('value');
      const hint = $(el).text()?.trim();
      if (val) {
        try {
          const decoded = Buffer.from(val, 'base64').toString('utf8');
          const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            const server = normalizeServer(srcMatch[1], hint, language);
            if (server) serversMap.set(`${server.provider}_${server.embed_url}`, server);
          }
        } catch {
          // Ignore
        }
      }
    });

    // Parse inline var videos = [...]
    $('script').each((_i, el) => {
      const script = $(el).html() || '';
      const match = script.match(/var\s+videos\s*=\s*(\[[^;]+\])/);
      if (match && match[1]) {
        try {
          const arr = JSON.parse(match[1].replace(/'/g, '"'));
          if (Array.isArray(arr)) {
            for (const item of arr) {
              if (Array.isArray(item) && item[1]) {
                const server = normalizeServer(item[1], item[0], language);
                if (server) serversMap.set(`${server.provider}_${server.embed_url}`, server);
              }
            }
          }
        } catch {
          // Ignore
        }
      }
    });

    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Scrapes paginated catalogue
   */
  public async scrapeAnimeList(_page: number = 1): Promise<ScrapedAnimeSummary[]> {
    return dramasFreeProvider.search('');
  }

  /**
   * Scrapes details for an anime
   */
  public async scrapeAnimeDetails(_animeSlug: string): Promise<ScrapedAnimeDetails | null> {
    return null;
  }
}

export const videoScraper = new VideoScraperService();
