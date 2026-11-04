import { getTursoClient, initTursoDatabase } from '../config/turso.js';

export interface ReactionStats {
  likes: number;
  dislikes: number;
  user_reaction: 'like' | 'dislike' | null;
}

export class ReactionService {
  /**
   * Retrieves global like/dislike counts and current user's reaction for an episode
   */
  public async getEpisodeReactions(episodeId: number, userId?: string): Promise<ReactionStats> {
    await initTursoDatabase();
    const client = getTursoClient();

    const [statsRes, userRes] = await Promise.all([
      client.execute({
        sql: `SELECT likes_count, dislikes_count FROM episode_reaction_stats WHERE episode_id = ?`,
        args: [episodeId],
      }),
      userId
        ? client.execute({
            sql: `SELECT reaction_type FROM episode_reactions WHERE episode_id = ? AND user_id = ?`,
            args: [episodeId, userId],
          })
        : Promise.resolve({ rows: [] }),
    ]);

    const likes = Number(statsRes.rows[0]?.likes_count || 0);
    const dislikes = Number(statsRes.rows[0]?.dislikes_count || 0);
    const user_reaction = (userRes.rows[0]?.reaction_type as 'like' | 'dislike') || null;

    return { likes, dislikes, user_reaction };
  }

  /**
   * Sets or toggles user reaction ('like' or 'dislike')
   */
  public async setEpisodeReaction(
    episodeId: number,
    userId: string,
    reactionType: 'like' | 'dislike'
  ): Promise<ReactionStats> {
    await initTursoDatabase();
    const client = getTursoClient();
    const now = new Date().toISOString();

    // Ensure stats row exists
    await client.execute({
      sql: `INSERT OR IGNORE INTO episode_reaction_stats (episode_id, likes_count, dislikes_count) VALUES (?, 0, 0)`,
      args: [episodeId],
    });

    // Check existing reaction
    const existing = await client.execute({
      sql: `SELECT reaction_type FROM episode_reactions WHERE episode_id = ? AND user_id = ?`,
      args: [episodeId, userId],
    });

    const currentReaction = existing.rows[0]?.reaction_type as string | undefined;
    let newReaction: 'like' | 'dislike' | null = null;

    if (currentReaction === reactionType) {
      // Toggle OFF
      const decField = reactionType === 'like' ? 'likes_count' : 'dislikes_count';
      await client.batch(
        [
          {
            sql: `DELETE FROM episode_reactions WHERE episode_id = ? AND user_id = ?`,
            args: [episodeId, userId],
          },
          {
            sql: `UPDATE episode_reaction_stats SET ${decField} = MAX(0, ${decField} - 1) WHERE episode_id = ?`,
            args: [episodeId],
          },
        ],
        'write'
      );
      newReaction = null;
    } else if (currentReaction) {
      // Switch from like <-> dislike
      const decField = currentReaction === 'like' ? 'likes_count' : 'dislikes_count';
      const incField = reactionType === 'like' ? 'likes_count' : 'dislikes_count';
      await client.batch(
        [
          {
            sql: `UPDATE episode_reactions SET reaction_type = ?, updated_at = ? WHERE episode_id = ? AND user_id = ?`,
            args: [reactionType, now, episodeId, userId],
          },
          {
            sql: `UPDATE episode_reaction_stats SET ${decField} = MAX(0, ${decField} - 1), ${incField} = ${incField} + 1 WHERE episode_id = ?`,
            args: [episodeId],
          },
        ],
        'write'
      );
      newReaction = reactionType;
    } else {
      // New reaction
      const incField = reactionType === 'like' ? 'likes_count' : 'dislikes_count';
      await client.batch(
        [
          {
            sql: `INSERT INTO episode_reactions (episode_id, user_id, reaction_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
            args: [episodeId, userId, reactionType, now, now],
          },
          {
            sql: `UPDATE episode_reaction_stats SET ${incField} = ${incField} + 1 WHERE episode_id = ?`,
            args: [episodeId],
          },
        ],
        'write'
      );
      newReaction = reactionType;
    }

    const updatedStats = await client.execute({
      sql: `SELECT likes_count, dislikes_count FROM episode_reaction_stats WHERE episode_id = ?`,
      args: [episodeId],
    });

    return {
      likes: Number(updatedStats.rows[0]?.likes_count || 0),
      dislikes: Number(updatedStats.rows[0]?.dislikes_count || 0),
      user_reaction: newReaction,
    };
  }
}

export const reactionService = new ReactionService();
