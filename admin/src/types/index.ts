export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type AnimeStatus = 'emision' | 'finalizado' | 'proximamente';
export type EpisodeStatus = 'pending' | 'available' | 'unavailable';
export type StreamLanguage = 'sub' | 'dub';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'failed';

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
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

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface AvatarItem {
  id: number;
  filename: string;
  is_default: boolean;
  url: string;
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
  source_url?: string | null;
  source_id?: string | null;
  source_type?: string;
  discovered_variants?: VariantSummary[];
  genres?: Genre[];
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  anime_id: number;
  episode_number: number;
  source_episode_id?: string | null;
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
  last_verified_at?: string | null;
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
  source_url?: string | null;
  source_id?: string | null;
  frozen_config?: Record<string, any>;
  target_mode?: 'all' | 'single' | 'pending';
  target_episode_number?: number | null;
  error_log: { episode_number?: number; error?: string; timestamp?: string; message?: string; level?: string; detail?: string }[];
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
  episode_id: number;
  episode_air_date: string;
  notification_date: string;
  notification_type: '3_days' | '2_days' | '1_day';
  is_read: boolean;
  created_at: string;
  animes?: {
    id: number;
    name: string;
    cover_image: string | null;
    slug: string;
  } | null;
  episodes?: {
    id: number;
    episode_number: number;
    title: string | null;
  } | null;
}

export interface AuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  } | null;
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

export interface SeasonWithEntries extends SeriesSeason {
  entries: (SeriesEntry & {
    anime: Anime;
  })[];
}

export interface SeriesWithSeasons extends Series {
  seasons: SeasonWithEntries[];
  total_seasons_count?: number;
  total_episodes_count?: number;
}

export interface AniListSearchResult {
  media: {
    id: number;
    title: {
      romaji?: string;
      english?: string;
      native?: string;
      userPreferred?: string;
    };
    description?: string;
    coverImage?: {
      extraLarge?: string;
      large?: string;
      medium?: string;
    };
    bannerImage?: string;
    status?: string;
    episodes?: number;
    seasonYear?: number;
    format?: string;
    genres?: string[];
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
  }[];
  total: number;
  hasNextPage: boolean;
}
