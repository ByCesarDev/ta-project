export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type AnimeStatus = 'emision' | 'finalizado' | 'proximamente';
export type EpisodeStatus = 'pending' | 'available' | 'unavailable';
export type StreamLanguage = 'sub' | 'dub';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
  status: UserStatus;
  updated_by?: string;
  updated_at: string;
}

export interface UserWithRole {
  id: string;
  email?: string;
  username: string;
  avatar_url: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Anime {
  id: number;
  name: string;
  title_romaji?: string;
  title_english?: string;
  title_native?: string;
  cover_image: string;
  banner_image?: string;
  status: AnimeStatus;
  episodes: number;
  description: string;
  anilist_id?: number;
  claimed_by?: string;
  season_year?: number;
  format?: string;
  slug: string;
  air_day?: number;
  air_time?: string;
  air_timezone?: string;
  start_date?: string;
  end_date?: string;
  views_count: number;
  genres?: Genre[];
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  anime_id: number;
  episode_number: number;
  title?: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  air_at?: string;
  status: EpisodeStatus;
  views: number;
  created_by?: string;
  sources?: EpisodeSource[];
  created_at: string;
  updated_at: string;
}

export interface EpisodeSource {
  id?: number;
  episode_id: number;
  provider: string;
  server_name: string;
  embed_url: string;
  direct_stream_url?: string;
  language: StreamLanguage;
  quality: string;
  priority: number;
  is_active: boolean;
  last_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScrapeJob {
  id: string;
  anime_id: number;
  status: JobStatus;
  total_episodes: number;
  processed_episodes: number;
  failed_episodes: number;
  error_log: { episode_number?: number; error?: string; timestamp?: string; message?: string }[];
  requested_by?: string;
  created_at: string;
  updated_at: string;
  animes?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface AdminNotification {
  id: number;
  moderator_id: string;
  anime_id: number;
  episode_number: number;
  air_date: string;
  alert_type: '3_days' | '2_days' | '1_day';
  is_read: boolean;
  created_at: string;
  animes?: {
    id: number;
    name: string;
    cover_image: string;
    slug: string;
  };
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export interface AniListSearchResult {
  media: {
    id: number;
    title: {
      romaji?: string;
      english?: string;
      native?: string;
    };
    description?: string;
    coverImage?: {
      extraLarge?: string;
      large?: string;
    };
    bannerImage?: string;
    status?: string;
    episodes?: number;
    seasonYear?: number;
    format?: string;
    genres?: string[];
  }[];
  total: number;
  hasNextPage: boolean;
}
