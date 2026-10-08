import { Database } from './database.js';

export type UserRole = Database['public']['Tables']['user_roles']['Row']['role'];
export type UserStatus = Database['public']['Tables']['user_roles']['Row']['status'];
export type EpisodeStatus = Database['public']['Tables']['episodes']['Row']['status'];
export type StreamLanguage = Database['public']['Tables']['episode_sources']['Row']['language'];

export type AnimeRow = Database['public']['Tables']['animes']['Row'];
export type EpisodeRow = Database['public']['Tables']['episodes']['Row'];
export type EpisodeSourceRow = Database['public']['Tables']['episode_sources']['Row'];
export type GenreRow = Database['public']['Tables']['genres']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type UserHistoryRow = Database['public']['Tables']['user_history']['Row'];
export type WatchLaterRow = Database['public']['Tables']['watch_later']['Row'];
export type SeriesRow = Database['public']['Tables']['series']['Row'];
export type SeriesSeasonRow = Database['public']['Tables']['series_seasons']['Row'];
export type SeriesEntryRow = Database['public']['Tables']['series_entries']['Row'];
export type AnimeSourceBindingRow = Database['public']['Tables']['anime_source_bindings']['Row'];
export type SeriesSlugRedirectRow = Database['public']['Tables']['series_slug_redirects']['Row'];
export type UserFavoriteRow = Database['public']['Tables']['user_favorites']['Row'];

export type SeasonKind = 'season' | 'movie' | 'special' | 'ova';

export interface SeasonWithEntries extends SeriesSeasonRow {
  entries?: (SeriesEntryRow & {
    anime: AnimeRow & {
      episodes?: EpisodeWithSources[];
    };
  })[];
  series_entries?: (SeriesEntryRow & {
    anime: AnimeRow & {
      episodes?: EpisodeWithSources[];
    };
  })[];
}

export interface SeriesWithSeasons extends SeriesRow {
  seasons: SeasonWithEntries[];
  genres?: GenreRow[];
  total_seasons_count?: number;
  total_episodes_count?: number;
  active_season?: SeasonWithEntries;
}

export interface SeriesFilters {
  search?: string;
  genreSlug?: string;
  status?: string;
  format?: string;
  sortBy?: 'views' | 'recent' | 'name' | 'episodes';
  page?: number;
  limit?: number;
}

export interface AnimeWithGenres extends AnimeRow {
  anime_genres?: {
    genres: GenreRow | null;
  }[];
  genres?: GenreRow[];
}

export interface EpisodeWithSources extends EpisodeRow {
  sources?: EpisodeSourceRow[];
  user_progress?: {
    progress_seconds: number;
    total_seconds: number;
    is_completed: boolean;
  };
}

export interface WatchlistAnime {
  id: number;
  anime_id: number;
  created_at: string;
  anime: AnimeRow;
}

export interface HistoryItem {
  id: number;
  episode_id: number;
  progress_seconds: number;
  total_seconds: number;
  is_completed: boolean;
  updated_at: string;
  episode: EpisodeRow & {
    anime: AnimeRow & {
      series_slug?: string;
      series_name?: string;
    };
  };
}

export interface AnimeFilters {
  search?: string;
  genreSlug?: string;
  status?: string;
  format?: string;
  sortBy?: 'views' | 'recent' | 'name' | 'episodes';
}

export interface ServerOption {
  id: number;
  episode_id: number;
  provider: string;
  server_name: string;
  embed_url: string;
  direct_stream_url?: string | null;
  language: StreamLanguage;
  audio_variant?: string;
  audio_language?: string;
  language_label?: string | null;
  source_key?: string;
  quality: string;
  priority: number;
  is_active: boolean;
  subtitles?: SubtitleTrack[];
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url?: string;
  isDefault?: boolean;
}

export interface PlayableStream {
  source_id?: number;
  provider: string;
  server_name: string;
  type: 'hls' | 'mp4' | 'iframe' | 'error';
  url: string;
  direct_url?: string | null;
  quality?: string;
  language?: StreamLanguage;
  audio_variant?: string;
  audio_language?: string;
  language_label?: string;
  source_key?: string;
  headers?: Record<string, string>;
  is_fallback?: boolean;
  error_message?: string;
  subtitles?: SubtitleTrack[];
}
