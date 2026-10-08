import { Request } from 'express';

export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type EpisodeStatus = 'pending' | 'available' | 'unavailable';
export type StreamLanguage = 'sub' | 'dub';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'failed';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface ScrapedServer {
  provider: string;
  server_name: string;
  embed_url: string;
  direct_stream_url?: string;
  language: StreamLanguage;
  audio_variant?: string;
  audio_language?: string;
  language_label?: string;
  source_key?: string;
  quality: string;
  priority: number;
  is_active?: boolean;
  subtitles?: SubtitleTrack[];
}

export interface VariantSummary {
  variant_id: string;
  name: string;
  audio_language: string;
  language_label: string;
  category?: number;
  website_param: string;
  episodes_count?: number;
  is_dub: boolean;
}

export interface SourcePreviewResult {
  source_url: string;
  source_id: string;
  title: string;
  cover_image?: string;
  total_episodes_found: number;
  published_episodes: number[];
  variants: VariantSummary[];
  category_name: 'drama' | 'movie';
}

export interface ScrapedAnimeSummary {
  name: string;
  slug: string;
  img?: string;
  dubbing?: string;
}

export interface ScrapedAnimeDetails {
  name: string;
  slug: string;
  description: string;
  genres: string[];
  information: Record<string, string>;
  cover_image?: string;
  banner_image?: string;
  status?: string;
  episodes_count?: number;
}

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  };
  description?: string;
  status?: string;
  episodes?: number;
  seasonYear?: number;
  format?: string;
  genres?: string[];
  coverImage?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
  relations?: {
    edges?: {
      relationType: string;
      node: {
        id: number;
        title?: {
          romaji?: string;
          english?: string;
          native?: string;
          userPreferred?: string;
        };
        format?: string;
        status?: string;
        episodes?: number;
        coverImage?: {
          large?: string;
          medium?: string;
        };
      };
    }[];
  };
}

export type SeasonKind = 'season' | 'movie' | 'special' | 'ova';

export interface Series {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  banner_image?: string | null;
  status: string;
  claimed_by?: string | null;
  claimed_at?: string | null;
  views_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeriesSeason {
  id: number;
  series_id: number;
  season_number?: number | null;
  name: string;
  kind: SeasonKind;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SeriesEntry {
  id: number;
  season_id: number;
  anime_id: number;
  display_order: number;
  part_label?: string | null;
  created_at: string;
}

export interface AnimeSourceBinding {
  id: number;
  anime_id: number;
  provider: string;
  source_url: string;
  source_season_id?: string | null;
  audio_variants_config: VariantSummary[];
  episode_offset_map: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface SeriesSlugRedirect {
  old_slug: string;
  target_series_id: number;
  target_season_id?: number | null;
  created_at: string;
}

export interface NormalizedAnimeInsert {
  name: string;
  title_romaji?: string;
  title_english?: string;
  title_native?: string;
  slug: string;
  cover_image: string;
  banner_image?: string;
  status: 'emision' | 'finalizado' | 'proximamente';
  episodes: number;
  description: string;
  anilist_id?: number;
  season_year?: number;
  format?: string;
  air_day?: number;
  air_time?: string;
  air_timezone?: string;
  start_date?: string;
  end_date?: string;
  source_url?: string | null;
  source_id?: string | null;
  source_type?: string;
  discovered_variants?: VariantSummary[];
}

export interface ScrapeJob {
  id: string;
  anime_id: number;
  status: JobStatus;
  total_episodes: number;
  processed_episodes: number;
  failed_episodes: number;
  attempts?: number;
  max_attempts?: number;
  locked_at?: string | null;
  locked_by?: string | null;
  heartbeat_at?: string | null;
  error_log: unknown[];
  requested_by?: string | null;
  source_url?: string | null;
  source_id?: string | null;
  source_config?: Record<string, any> | null;
  frozen_config?: Record<string, any>;
  target_mode?: 'all' | 'single' | 'pending';
  target_episode_number?: number | null;
  created_at: string;
  updated_at: string;
}
