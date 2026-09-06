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
    anime: AnimeRow;
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
  provider: string;
  server_name: string;
  embed_url: string;
  direct_stream_url?: string | null;
  language: StreamLanguage;
  quality: string;
  priority: number;
  is_active: boolean;
}
