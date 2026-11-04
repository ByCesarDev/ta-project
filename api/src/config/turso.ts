import { createClient, Client } from '@libsql/client';

let tursoClient: Client | null = null;
let initPromise: Promise<void> | null = null;

export const getTursoClient = (): Client => {
  if (!tursoClient) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local_comments.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

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
        `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON episode_comments(parent_id)`
      ], 'write');
    })();
  }
  return initPromise;
};
