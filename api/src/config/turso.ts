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
        `CREATE INDEX IF NOT EXISTS idx_saved_episodes_user ON user_saved_episodes(user_id, created_at DESC)`,
        `CREATE TABLE IF NOT EXISTS viewer_profiles (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          is_default INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_viewer_profiles_account ON viewer_profiles(account_id)`
      ], 'write');

      // Check if episode_reactions needs migration to (episode_id, viewer_profile_id) PK
      try {
        const tableInfo = await client.execute(`PRAGMA table_info(episode_reactions)`);
        const userCol = tableInfo.rows.find((c: any) => c.name === 'user_id');
        const profileCol = tableInfo.rows.find((c: any) => c.name === 'viewer_profile_id');
        if (userCol && Number(userCol.pk) > 0 && (!profileCol || Number(profileCol.pk) === 0)) {
          await client.batch([
            `CREATE TABLE IF NOT EXISTS episode_reactions_v2 (
              episode_id INTEGER NOT NULL,
              user_id TEXT NOT NULL,
              viewer_profile_id TEXT NOT NULL,
              reaction_type TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              PRIMARY KEY (episode_id, viewer_profile_id)
            )`,
            `INSERT OR IGNORE INTO episode_reactions_v2 (episode_id, user_id, viewer_profile_id, reaction_type, created_at, updated_at)
             SELECT episode_id, user_id, COALESCE(viewer_profile_id, user_id), reaction_type, created_at, updated_at FROM episode_reactions`,
            `DROP TABLE episode_reactions`,
            `ALTER TABLE episode_reactions_v2 RENAME TO episode_reactions`,
            `CREATE INDEX IF NOT EXISTS idx_reactions_profile ON episode_reactions(viewer_profile_id, episode_id)`,
            `CREATE INDEX IF NOT EXISTS idx_reactions_episode_id ON episode_reactions(episode_id)`
          ], 'write');
        }
      } catch (err) {
        console.warn('[Turso] episode_reactions PK migration check:', err);
      }

      // Check if user_saved_episodes needs migration to UNIQUE(viewer_profile_id, episode_id)
      try {
        const savedInfo = await client.execute(`PRAGMA table_info(user_saved_episodes)`);
        const profileCol = savedInfo.rows.find((c: any) => c.name === 'viewer_profile_id');
        if (!profileCol) {
          await client.batch([
            `CREATE TABLE IF NOT EXISTS user_saved_episodes_v2 (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              viewer_profile_id TEXT NOT NULL,
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
              UNIQUE(viewer_profile_id, episode_id)
            )`,
            `INSERT OR IGNORE INTO user_saved_episodes_v2 (id, user_id, viewer_profile_id, episode_id, anime_id, series_id, anime_slug, anime_title, episode_number, episode_title, thumbnail, duration, created_at)
             SELECT id, user_id, user_id, episode_id, anime_id, series_id, anime_slug, anime_title, episode_number, episode_title, thumbnail, duration, created_at FROM user_saved_episodes`,
            `DROP TABLE user_saved_episodes`,
            `ALTER TABLE user_saved_episodes_v2 RENAME TO user_saved_episodes`,
            `CREATE INDEX IF NOT EXISTS idx_saved_episodes_profile ON user_saved_episodes(viewer_profile_id, created_at DESC)`
          ], 'write');
        }
      } catch (err) {
        console.warn('[Turso] user_saved_episodes migration check:', err);
      }
      // Check if episode_comments needs viewer_profile_id column
      try {
        const commentInfo = await client.execute(`PRAGMA table_info(episode_comments)`);
        const profileCol = commentInfo.rows.find((c: any) => c.name === 'viewer_profile_id' || c[1] === 'viewer_profile_id');
        if (!profileCol) {
          try {
            await client.execute(`ALTER TABLE episode_comments ADD COLUMN viewer_profile_id TEXT`);
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_comments_profile_id ON episode_comments(viewer_profile_id)`);
          } catch (colErr: any) {
            if (!colErr.message?.includes('duplicate column')) {
              throw colErr;
            }
          }
        }
      } catch (err) {
        console.warn('[Turso] episode_comments viewer_profile_id migration check:', err);
      }
    })();
  }
  return initPromise;
};

