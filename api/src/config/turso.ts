import { createClient, Client } from '@libsql/client';
import { env } from './env.js';

let tursoClient: Client | null = null;
let initPromise: Promise<void> | null = null;

export const getTursoClient = (): Client => {
  if (!tursoClient) {
    const url = env.TURSO_DATABASE_URL || 'file:local_comments.db';
    const authToken = env.TURSO_AUTH_TOKEN || undefined;

    tursoClient = createClient({
      url,
      authToken,
    });
  }
  return tursoClient;
};

/**
 * Ensures the required tables and indexes exist in Turso / SQLite
 */
export const initTursoDatabase = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = (async () => {
      const client = getTursoClient();

      await client.batch([
        `CREATE TABLE IF NOT EXISTS episode_comments (
          id TEXT PRIMARY KEY,
          episode_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          username TEXT NOT NULL,
          avatar_url TEXT,
          user_role TEXT DEFAULT 'user',
          content TEXT NOT NULL,
          is_spoiler INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0,
          parent_id TEXT,
          likes_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS episode_comment_likes (
          comment_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (comment_id, user_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_comments_episode_id ON episode_comments(episode_id, created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON episode_comments(parent_id)`,
        `CREATE TABLE IF NOT EXISTS episode_reactions (
          episode_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          reaction_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (episode_id, user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS episode_reaction_stats (
          episode_id INTEGER PRIMARY KEY,
          likes_count INTEGER DEFAULT 0,
          dislikes_count INTEGER DEFAULT 0
        )`,
        `CREATE INDEX IF NOT EXISTS idx_reactions_episode_id ON episode_reactions(episode_id)`,
        `CREATE TABLE IF NOT EXISTS user_saved_episodes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          episode_id INTEGER NOT NULL,
          anime_id INTEGER,
          series_id INTEGER,
          anime_slug TEXT NOT NULL,
          anime_title TEXT NOT NULL,
          episode_number INTEGER NOT NULL,
          episode_title TEXT,
          thumbnail TEXT,
          duration TEXT,
          created_at TEXT NOT NULL,
          UNIQUE(user_id, episode_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_saved_episodes_user ON user_saved_episodes(user_id, created_at DESC)`
      ], 'write');
    })();
  }
  return initPromise;
};

