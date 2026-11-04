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
          display_name TEXT NOT NULL DEFAULT '',
          username TEXT NOT NULL DEFAULT '',
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
      // Check if viewer_profiles needs display_name and username columns
      try {
        try {
          await client.execute(`ALTER TABLE viewer_profiles ADD COLUMN display_name TEXT NOT NULL DEFAULT ''`);
        } catch {
          // column already exists
        }
        await client.execute(`UPDATE viewer_profiles SET display_name = name WHERE display_name = '' OR display_name IS NULL`);

        try {
          await client.execute(`ALTER TABLE viewer_profiles ADD COLUMN username TEXT NOT NULL DEFAULT ''`);
        } catch {
          // column already exists
        }

        // Backfill missing/empty usernames with unique lowercase handles
        const emptyUsernames = await client.execute(`SELECT id, name, account_id FROM viewer_profiles WHERE username = '' OR username IS NULL`);
        for (const row of emptyUsernames.rows as any[]) {
          let base = String(row.name || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
          if (base.length < 3) base = `user_${base}`.slice(0, 20);
          let candidate = base;
          let counter = 1;
          while (true) {
            const check = await client.execute({
              sql: `SELECT id FROM viewer_profiles WHERE LOWER(username) = ? AND id != ?`,
              args: [candidate, String(row.id)],
            });
            if (check.rows.length === 0) break;
            candidate = `${base}_${counter++}`;
          }
          await client.execute({
            sql: `UPDATE viewer_profiles SET username = ?, display_name = COALESCE(NULLIF(display_name, ''), name) WHERE id = ?`,
            args: [candidate, String(row.id)],
          });
        }

        // Ensure unique index on username
        await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_viewer_profiles_username ON viewer_profiles(LOWER(username))`);
      } catch (err) {
        console.warn('[Turso] viewer_profiles username/display_name migration check:', err);
      }

      // Check if episode_comments needs viewer_profile_id and display_name columns
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

        const displayCol = commentInfo.rows.find((c: any) => c.name === 'display_name' || c[1] === 'display_name');
        if (!displayCol) {
          try {
            await client.execute(`ALTER TABLE episode_comments ADD COLUMN display_name TEXT`);
            await client.execute(`UPDATE episode_comments SET display_name = username WHERE display_name IS NULL OR display_name = ''`);
          } catch (colErr: any) {
            if (!colErr.message?.includes('duplicate column')) {
              throw colErr;
            }
          }
        }
      } catch (err) {
        console.warn('[Turso] episode_comments viewer_profile_id migration check:', err);
      }

      // Check if episode_comment_likes needs migration to (comment_id, viewer_profile_id) PK
      try {
        const likesInfo = await client.execute(`PRAGMA table_info(episode_comment_likes)`);
        const profileCol = likesInfo.rows.find((c: any) => c.name === 'viewer_profile_id' || c[1] === 'viewer_profile_id');
        if (!profileCol) {
          await client.batch([
            `CREATE TABLE IF NOT EXISTS episode_comment_likes_v2 (
              comment_id TEXT NOT NULL,
              viewer_profile_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              PRIMARY KEY (comment_id, viewer_profile_id)
            )`,
            `INSERT OR IGNORE INTO episode_comment_likes_v2 (comment_id, viewer_profile_id, user_id, created_at)
             SELECT comment_id, user_id, user_id, created_at FROM episode_comment_likes`,
            `DROP TABLE episode_comment_likes`,
            `ALTER TABLE episode_comment_likes_v2 RENAME TO episode_comment_likes`,
            `CREATE INDEX IF NOT EXISTS idx_comment_likes_profile ON episode_comment_likes(viewer_profile_id)`
          ], 'write');
        }
      } catch (err) {
        console.warn('[Turso] episode_comment_likes viewer_profile_id migration check:', err);
      }
    })();
  }
  return initPromise;
};

