import { Request } from 'express';

export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type EpisodeStatus = 'pending' | 'available' | 'unavailable';
export type StreamLanguage = 'sub' | 'dub';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

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

export interface ScrapedServer {
  provider: string;
  server_name: string;
  embed_url: string;
  direct_stream_url?: string;
  language: StreamLanguage;
  quality: string;
  priority: number;
  is_active?: boolean;
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
  created_at: string;
  updated_at: string;
}


