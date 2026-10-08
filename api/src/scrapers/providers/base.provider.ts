import {
  ScrapedAnimeDetails,
  ScrapedAnimeSummary,
  ScrapedServer,
  SourcePreviewResult,
  StreamLanguage,
} from '../../types/index.js';

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
   * Previews a source without downloading all fragments
   */
  previewSource?(sourceUrlOrParam: string): Promise<SourcePreviewResult | null>;

  /**
   * Scrapes servers and embed links for a specific episode
   */
  getEpisodeServers(
    slug: string,
    episodeNumber: number | string,
    language?: StreamLanguage,
    fallbackSlug?: string
  ): Promise<ScrapedServer[]>;

  /**
   * Scrapes all available audio versions for a specific episode
   */
  getAllEpisodeServers?(
    sourceUrlOrParam: string,
    episodeNumber: number | string
  ): Promise<ScrapedServer[]>;
}
