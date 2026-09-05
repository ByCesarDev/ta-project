import axios, { AxiosInstance } from 'axios';
import { AniListMedia, NormalizedAnimeInsert } from '../types/index.js';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const SEARCH_ANIME_QUERY = `
query ($query: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(search: $query, type: ANIME, sort: POPULARITY_DESC) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      description
      status
      episodes
      seasonYear
      format
      genres
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
    }
  }
}
`;

const GET_ANIME_BY_ID_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
      native
      userPreferred
    }
    description
    status
    episodes
    seasonYear
    format
    genres
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    nextAiringEpisode {
      airingAt
      timeUntilAiring
      episode
    }
  }
}
`;

export class AniListService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ANILIST_GRAPHQL_ENDPOINT,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Cleans raw HTML tags from AniList description
   */
  public cleanDescription(rawDesc?: string): string {
    if (!rawDesc) return '';
    return rawDesc
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<i>/gi, '')
      .replace(/<\/i>/gi, '')
      .replace(/<b>/gi, '')
      .replace(/<\/b>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Generates URL slug from anime title
   */
  public generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Maps AniList status enum to TotalAnime status
   */
  public mapStatus(anilistStatus?: string): 'emision' | 'finalizado' | 'proximamente' {
    switch (anilistStatus) {
      case 'RELEASING':
        return 'emision';
      case 'FINISHED':
      case 'CANCELLED':
        return 'finalizado';
      case 'NOT_YET_RELEASED':
      default:
        return 'proximamente';
    }
  }

  /**
   * Search anime by text query
   */
  public async searchAnime(query: string, page: number = 1, perPage: number = 10): Promise<{
    media: AniListMedia[];
    total: number;
    hasNextPage: boolean;
  }> {
    try {
      const response = await this.client.post('', {
        query: SEARCH_ANIME_QUERY,
        variables: { query, page, perPage },
      });

      const pageData = response.data?.data?.Page;
      return {
        media: pageData?.media || [],
        total: pageData?.pageInfo?.total || 0,
        hasNextPage: pageData?.pageInfo?.hasNextPage || false,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'GraphQL request failed';
      throw new Error(`AniList Search Failed: ${message}`);
    }
  }

  /**
   * Retrieve single anime by AniList ID
   */
  public async getAnimeById(id: number): Promise<AniListMedia | null> {
    try {
      const response = await this.client.post('', {
        query: GET_ANIME_BY_ID_QUERY,
        variables: { id },
      });

      return response.data?.data?.Media || null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'GraphQL request failed';
      throw new Error(`AniList Fetch By ID (${id}) Failed: ${message}`);
    }
  }

  /**
   * Normalizes AniList Media object to PostgreSQL public.animes insert format
   */
  public formatForSupabase(media: AniListMedia): {
    anime: NormalizedAnimeInsert;
    genres: string[];
  } {
    const primaryName =
      media.title.english || media.title.romaji || media.title.userPreferred || 'Anime Sin Título';

    const slug = this.generateSlug(primaryName);

    // Format dates (YYYY-MM-DD)
    let startDate: string | undefined;
    if (media.startDate?.year) {
      const y = media.startDate.year;
      const m = String(media.startDate.month || 1).padStart(2, '0');
      const d = String(media.startDate.day || 1).padStart(2, '0');
      startDate = `${y}-${m}-${d}`;
    }

    let endDate: string | undefined;
    if (media.endDate?.year) {
      const y = media.endDate.year;
      const m = String(media.endDate.month || 1).padStart(2, '0');
      const d = String(media.endDate.day || 1).padStart(2, '0');
      endDate = `${y}-${m}-${d}`;
    }

    // Airing time & day calculations if next episode available
    let airDay: number | undefined;
    let airTime: string | undefined;
    if (media.nextAiringEpisode?.airingAt) {
      const airDate = new Date(media.nextAiringEpisode.airingAt * 1000);
      airDay = airDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
      airTime = airDate.toISOString().substring(11, 19); // HH:mm:ss
    }

    const anime: NormalizedAnimeInsert = {
      name: primaryName,
      title_romaji: media.title.romaji,
      title_english: media.title.english,
      title_native: media.title.native,
      slug,
      cover_image:
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        media.coverImage?.medium ||
        'https://totalanime.com/placeholder-cover.webp',
      banner_image: media.bannerImage,
      status: this.mapStatus(media.status),
      episodes: media.episodes || 0,
      description: this.cleanDescription(media.description),
      anilist_id: media.id,
      season_year: media.seasonYear || media.startDate?.year,
      format: media.format,
      air_day: airDay,
      air_time: airTime,
      air_timezone: 'UTC',
      start_date: startDate,
      end_date: endDate,
    };

    return {
      anime,
      genres: media.genres || [],
    };
  }
}

export const anilistService = new AniListService();
