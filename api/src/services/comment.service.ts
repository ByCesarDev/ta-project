import crypto from 'node:crypto';
import { getTursoClient, initTursoDatabase } from '../config/turso.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface CommentItem {
  id: string;
  episode_id: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  user_role: string;
  content: string;
  is_spoiler: boolean;
  is_deleted: boolean;
  parent_id: string | null;
  likes_count: number;
  is_liked_by_me?: boolean;
  created_at: string;
  updated_at: string;
  replies?: CommentItem[];
}

export class CommentService {
  /**
   * Returns all comments for an episode, grouped hierarchically (threads)
   */
  public async getCommentsByEpisode(
    episodeId: number,
    currentUserId?: string
  ): Promise<{ comments: CommentItem[]; total_count: number }> {
    await initTursoDatabase();
    const client = getTursoClient();

    const result = await client.execute({
      sql: `SELECT id, episode_id, user_id, username, avatar_url, user_role, content, 
                   is_spoiler, is_deleted, parent_id, likes_count, created_at, updated_at 
            FROM episode_comments 
            WHERE episode_id = ? 
            ORDER BY created_at ASC`,
      args: [episodeId],
    });

    let likedSet = new Set<string>();
    if (currentUserId) {
      const likesResult = await client.execute({
        sql: `SELECT comment_id FROM episode_comment_likes WHERE user_id = ?`,
        args: [currentUserId],
      });
      likedSet = new Set(likesResult.rows.map((r) => String(r.comment_id)));
    }

    const allComments: CommentItem[] = result.rows.map((row: any) => ({
      id: String(row.id),
      episode_id: Number(row.episode_id),
      user_id: String(row.user_id),
      username: String(row.username),
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      user_role: String(row.user_role || 'user'),
      content: Boolean(row.is_deleted) ? '[Comentario eliminado]' : String(row.content),
      is_spoiler: Boolean(row.is_spoiler),
      is_deleted: Boolean(row.is_deleted),
      parent_id: row.parent_id ? String(row.parent_id) : null,
      likes_count: Number(row.likes_count || 0),
      is_liked_by_me: likedSet.has(String(row.id)),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      replies: [],
    }));

    // Build hierarchy: root comments with nested replies
    const commentsById = new Map<string, CommentItem>();
    allComments.forEach((c) => commentsById.set(c.id, c));

    const rootComments: CommentItem[] = [];

    allComments.forEach((c) => {
      if (c.parent_id && commentsById.has(c.parent_id)) {
        commentsById.get(c.parent_id)!.replies!.push(c);
      } else {
        rootComments.push(c);
      }
    });

    // Root comments ordered by newest first
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      comments: rootComments,
      total_count: allComments.length,
    };
  }

  /**
   * Creates a new comment or reply
   */
  public async createComment(params: {
    episodeId: number;
    userId: string;
    fallbackUsername?: string;
    content: string;
    isSpoiler?: boolean;
    parentId?: string | null;
  }): Promise<CommentItem> {
    const { episodeId, userId, fallbackUsername, content, isSpoiler = false, parentId = null } = params;

    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('El comentario no puede estar vacío.');
    }
    if (trimmed.length > 2000) {
      throw new Error('El comentario supera el límite de 2000 caracteres.');
    }

    await initTursoDatabase();
    const client = getTursoClient();

    // Fetch user profile and role from Supabase to ensure authentic identity
    const [profileRes, roleRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('username, avatar_url').eq('id', userId).maybeSingle(),
      supabaseAdmin.from('user_roles').select('role, status').eq('user_id', userId).maybeSingle(),
    ]);

    if (roleRes.data?.status === 'banned') {
      throw new Error('Tu cuenta se encuentra suspendida. No puedes comentar.');
    }

    const username = profileRes.data?.username || fallbackUsername || 'Usuario';
    const avatarUrl = profileRes.data?.avatar_url || null;
    const userRole = roleRes.data?.role || 'user';

    // Verify parent comment exists if replying
    if (parentId) {
      const parentCheck = await client.execute({
        sql: `SELECT id FROM episode_comments WHERE id = ? AND episode_id = ?`,
        args: [parentId, episodeId],
      });
      if (parentCheck.rows.length === 0) {
        throw new Error('El comentario al que intentas responder no existe.');
      }
    }

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO episode_comments 
            (id, episode_id, user_id, username, avatar_url, user_role, content, is_spoiler, is_deleted, parent_id, likes_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)`,
      args: [
        commentId,
        episodeId,
        userId,
        username,
        avatarUrl,
        userRole,
        trimmed,
        isSpoiler ? 1 : 0,
        parentId || null,
        now,
        now,
      ],
    });

    return {
      id: commentId,
      episode_id: episodeId,
      user_id: userId,
      username,
      avatar_url: avatarUrl,
      user_role: userRole,
      content: trimmed,
      is_spoiler: Boolean(isSpoiler),
      is_deleted: false,
      parent_id: parentId || null,
      likes_count: 0,
      is_liked_by_me: false,
      created_at: now,
      updated_at: now,
      replies: [],
    };
  }

  /**
   * Toggles like state on a comment
   */
  public async toggleLike(
    commentId: string,
    userId: string
  ): Promise<{ liked: boolean; likes_count: number }> {
    await initTursoDatabase();
    const client = getTursoClient();

    const existing = await client.execute({
      sql: `SELECT 1 FROM episode_comment_likes WHERE comment_id = ? AND user_id = ?`,
      args: [commentId, userId],
    });

    let liked = false;
    if (existing.rows.length > 0) {
      await client.batch(
        [
          {
            sql: `DELETE FROM episode_comment_likes WHERE comment_id = ? AND user_id = ?`,
            args: [commentId, userId],
          },
          {
            sql: `UPDATE episode_comments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
            args: [commentId],
          },
        ],
        'write'
      );
      liked = false;
    } else {
      const now = new Date().toISOString();
      await client.batch(
        [
          {
            sql: `INSERT OR IGNORE INTO episode_comment_likes (comment_id, user_id, created_at) VALUES (?, ?, ?)`,
            args: [commentId, userId, now],
          },
          {
            sql: `UPDATE episode_comments SET likes_count = likes_count + 1 WHERE id = ?`,
            args: [commentId],
          },
        ],
        'write'
      );
      liked = true;
    }

    const countRes = await client.execute({
      sql: `SELECT likes_count FROM episode_comments WHERE id = ?`,
      args: [commentId],
    });

    return {
      liked,
      likes_count: Number(countRes.rows[0]?.likes_count || 0),
    };
  }

  /**
   * Deletes a comment (soft deletes if has replies, hard deletes if leaf)
   */
  public async deleteComment(commentId: string, userId: string, userRole?: string): Promise<void> {
    await initTursoDatabase();
    const client = getTursoClient();

    const targetRes = await client.execute({
      sql: `SELECT user_id FROM episode_comments WHERE id = ?`,
      args: [commentId],
    });

    if (targetRes.rows.length === 0) {
      throw new Error('Comentario no encontrado.');
    }

    const authorId = String(targetRes.rows[0].user_id);
    if (authorId !== userId && userRole !== 'admin') {
      throw new Error('No tienes permisos para eliminar este comentario.');
    }

    const repliesRes = await client.execute({
      sql: `SELECT COUNT(*) as count FROM episode_comments WHERE parent_id = ?`,
      args: [commentId],
    });

    const hasReplies = Number(repliesRes.rows[0]?.count || 0) > 0;

    if (hasReplies) {
      await client.execute({
        sql: `UPDATE episode_comments SET is_deleted = 1, content = '[Comentario eliminado]' WHERE id = ?`,
        args: [commentId],
      });
    } else {
      await client.batch(
        [
          { sql: `DELETE FROM episode_comment_likes WHERE comment_id = ?`, args: [commentId] },
          { sql: `DELETE FROM episode_comments WHERE id = ?`, args: [commentId] },
        ],
        'write'
      );
    }
  }
}

export const commentService = new CommentService();

