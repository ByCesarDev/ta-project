import { animeFlvProvider, AnimeFlvProvider } from './providers/animeflv.provider.js';
import { cuevanaProvider } from './providers/cuevana.provider.js';
import { dramasFreeProvider } from './providers/dramasfree.provider.js';
import { soloLatinoProvider } from './providers/soloLatino.provider.js';
import { IStreamProvider } from './providers/base.provider.js';
import { ScrapedAnimeDetails, ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../types/index.js';

export class VideoScraperService {
  public readonly providers: IStreamProvider[];

  constructor() {
    this.providers = [
      animeFlvProvider,
      cuevanaProvider,
      soloLatinoProvider,
      dramasFreeProvider,
    ];
  }

  /**
   * Formats slug according to standard convention
   */
  public formatSlug(slug: string): string {
    return animeFlvProvider.formatSlug(slug);
  }

  /**
   * Scrapes servers and embed links for a specific episode across all enabled providers.
   * Prioritizes results matching the requested language (e.g. dub vs sub).
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
        ? [soloLatinoProvider, cuevanaProvider, dramasFreeProvider, animeFlvProvider]
        : [animeFlvProvider, cuevanaProvider, dramasFreeProvider, soloLatinoProvider];

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
      } catch (err: unknown) {
        return [];
      }
    });

    const resultsArray = await Promise.allSettled(promises);

    for (const res of resultsArray) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const server of res.value) {
          const key = `${server.provider}_${server.embed_url}_${server.language || language}`;
          if (!serversMap.has(key)) {
            serversMap.set(key, server);
          }
        }
      }
    }

    // Convert map to sorted array by priority ascending
    return Array.from(serversMap.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Parses raw HTML extracting embed links (maintained for compatibility)
   */
  public parseEpisodeHtml(html: string, language: StreamLanguage = 'sub'): ScrapedServer[] {
    return animeFlvProvider.parseEpisodeHtml(html, language);
  }

  /**
   * Scrapes paginated catalogue
   */
  public async scrapeAnimeList(_page: number = 1): Promise<ScrapedAnimeSummary[]> {
    return (animeFlvProvider as AnimeFlvProvider).search('');
  }

  /**
   * Scrapes details for an anime
   */
  public async scrapeAnimeDetails(animeSlug: string): Promise<ScrapedAnimeDetails | null> {
    return animeFlvProvider.getAnimeDetails ? animeFlvProvider.getAnimeDetails(animeSlug) : null;
  }
}

export const videoScraper = new VideoScraperService();
