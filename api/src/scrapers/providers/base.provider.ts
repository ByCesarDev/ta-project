import { ScrapedAnimeDetails, ScrapedAnimeSummary, ScrapedServer, StreamLanguage } from '../../types/index.js';

export interface IStreamProvider {
  readonly name: string;
  readonly baseUrl: string;
  readonly isEnabled: boolean;

  /**
   * Search titles in the provider catalogue
   */
  search(query: string): Promise<ScrapedAnimeSummary[]>;

  /**
   * Get metadata and episode list if supported
   */
  getAnimeDetails?(slug: string): Promise<ScrapedAnimeDetails | null>;

  /**
   * Scrapes servers and embed links for a specific episode
   */
  getEpisodeServers(
    slug: string,
    episodeNumber: number | string,
    language?: StreamLanguage,
    fallbackSlug?: string
  ): Promise<ScrapedServer[]>;
}
