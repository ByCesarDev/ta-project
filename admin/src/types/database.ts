export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type EpisodeStatus = 'pending' | 'available' | 'unavailable';
export type StreamLanguage = 'sub' | 'dub';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type NotificationType = '3_days' | '2_days' | '1_day';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string;
          bio: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string;
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string;
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: UserRole;
          status: UserStatus;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: UserRole;
          status?: UserStatus;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: UserRole;
          status?: UserStatus;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      animes: {
        Row: {
          id: number;
          name: string;
          title_romaji: string | null;
          title_english: string | null;
          title_native: string | null;
          cover_image: string | null;
          banner_image: string | null;
          status: string;
          episodes: number;
          description: string | null;
          anilist_id: number | null;
          claimed_by: string | null;
          claimed_at: string | null;
          season_year: number | null;
          format: string | null;
          slug: string;
          air_day: number | null;
          air_time: string | null;
          air_timezone: string | null;
          start_date: string | null;
          end_date: string | null;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          title_romaji?: string | null;
          title_english?: string | null;
          title_native?: string | null;
          cover_image?: string | null;
          banner_image?: string | null;
          status?: string;
          episodes?: number;
          description?: string | null;
          anilist_id?: number | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
          season_year?: number | null;
          format?: string | null;
          slug: string;
          air_day?: number | null;
          air_time?: string | null;
          air_timezone?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          title_romaji?: string | null;
          title_english?: string | null;
          title_native?: string | null;
          cover_image?: string | null;
          banner_image?: string | null;
          status?: string;
          episodes?: number;
          description?: string | null;
          anilist_id?: number | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
          season_year?: number | null;
          format?: string | null;
          slug?: string;
          air_day?: number | null;
          air_time?: string | null;
          air_timezone?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      episodes: {
        Row: {
          id: number;
          anime_id: number;
          episode_number: number;
          title: string | null;
          description: string | null;
          duration: number | null;
          thumbnail: string | null;
          air_at: string | null;
          status: EpisodeStatus;
          views: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          anime_id: number;
          episode_number: number;
          title?: string | null;
          description?: string | null;
          duration?: number | null;
          thumbnail?: string | null;
          air_at?: string | null;
          status?: EpisodeStatus;
          views?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          anime_id?: number;
          episode_number?: number;
          title?: string | null;
          description?: string | null;
          duration?: number | null;
          thumbnail?: string | null;
          air_at?: string | null;
          status?: EpisodeStatus;
          views?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "episodes_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "animes";
            referencedColumns: ["id"];
          }
        ];
      };
      episode_sources: {
        Row: {
          id: number;
          episode_id: number;
          provider: string;
          server_name: string;
          embed_url: string;
          direct_stream_url: string | null;
          language: StreamLanguage;
          quality: string;
          priority: number;
          is_active: boolean;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          episode_id: number;
          provider: string;
          server_name: string;
          embed_url: string;
          direct_stream_url?: string | null;
          language?: StreamLanguage;
          quality?: string;
          priority?: number;
          is_active?: boolean;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          episode_id?: number;
          provider?: string;
          server_name?: string;
          embed_url?: string;
          direct_stream_url?: string | null;
          language?: StreamLanguage;
          quality?: string;
          priority?: number;
          is_active?: boolean;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "episode_sources_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_notifications: {
        Row: {
          id: number;
          anime_id: number;
          episode_id: number;
          moderator_id: string;
          notification_type: NotificationType;
          episode_air_date: string;
          notification_date: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          anime_id: number;
          episode_id: number;
          moderator_id: string;
          notification_type: NotificationType;
          episode_air_date: string;
          notification_date: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          anime_id?: number;
          episode_id?: number;
          moderator_id?: string;
          notification_type?: NotificationType;
          episode_air_date?: string;
          notification_date?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_notifications_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "animes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_notifications_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scrape_jobs: {
        Row: {
          id: string;
          anime_id: number;
          status: JobStatus;
          total_episodes: number;
          processed_episodes: number;
          failed_episodes: number;
          attempts: number;
          max_attempts: number;
          locked_at: string | null;
          locked_by: string | null;
          heartbeat_at: string | null;
          error_log: Json;
          requested_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          anime_id: number;
          status?: JobStatus;
          total_episodes?: number;
          processed_episodes?: number;
          failed_episodes?: number;
          attempts?: number;
          max_attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          heartbeat_at?: string | null;
          error_log?: Json;
          requested_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          anime_id?: number;
          status?: JobStatus;
          total_episodes?: number;
          processed_episodes?: number;
          failed_episodes?: number;
          attempts?: number;
          max_attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          heartbeat_at?: string | null;
          error_log?: Json;
          requested_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scrape_jobs_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "animes";
            referencedColumns: ["id"];
          }
        ];
      };
      genres: {
        Row: {
          id: number;
          name: string;
          slug: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_anime: {
        Args: {
          p_anime_id: number;
        };
        Returns: boolean;
      };
      is_active_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_moderator_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      episode_status: EpisodeStatus;
      stream_language: StreamLanguage;
      job_status: JobStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
