import crypto from 'node:crypto';
import { getTursoClient, initTursoDatabase } from '../config/turso.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { viewerProfileService } from './viewerProfile.service.js';

export interface CommentItem {
  id: string;
  episode_id: number;
  user_id: string;
  viewer_profile_id?: string | null;
  username: string; // Unique public handle, e.g. "nelis"
  display_name?: string | null; // Visible friendly name, e.g. "Nelis"
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
    currentViewerProfileId?: string,
    currentUserId?: string
  ): Promise<{ comments: CommentItem[]; total_count: number }> {
    await initTursoDatabase();
    const client = getTursoClient();

    const result = await client.execute({
      sql: `SELECT ec.id, ec.episode_id, ec.user_id, ec.viewer_profile_id, 
                   ec.username, ec.display_name, ec.avatar_url, ec.user_role, ec.content, 
                   ec.is_spoiler, ec.is_deleted, ec.parent_id, ec.likes_count, ec.created_at, ec.updated_at,
                   vp.username AS profile_username,
                   vp.display_name AS profile_display_name,
                   vp.avatar_url AS profile_avatar_url
            FROM episode_comments ec
            LEFT JOIN viewer_profiles vp ON ec.viewer_profile_id = vp.id
            WHERE ec.episode_id = ? 
            ORDER BY ec.created_at ASC`,
      args: [episodeId],
    });

    let likedSet = new Set<string>();
    if (currentViewerProfileId) {
      const likesResult = await client.execute({
        sql: `SELECT comment_id FROM episode_comment_likes WHERE viewer_profile_id = ?`,
        args: [currentViewerProfileId],
      });
      likedSet = new Set(likesResult.rows.map((r) => String(r.comment_id)));
    } else if (currentUserId) {
      const likesResult = await client.execute({
        sql: `SELECT comment_id FROM episode_comment_likes WHERE user_id = ?`,
        args: [currentUserId],
      });
      likedSet = new Set(likesResult.rows.map((r) => String(r.comment_id)));
    }

    const allComments: CommentItem[] = result.rows.map((row: any) => {
      // Prioritize live viewer profile data, fallback to comment snapshot
      const username = String(row.profile_username || row.username || 'usuario');
      const displayName = String(row.profile_display_name || row.display_name || row.username || username);
      const avatarUrl = row.profile_avatar_url !== undefined && row.profile_avatar_url !== null
        ? String(row.profile_avatar_url)
        : (row.avatar_url ? String(row.avatar_url) : null);

      return {
        id: String(row.id),
        episode_id: Number(row.episode_id),
        user_id: String(row.user_id),
        viewer_profile_id: row.viewer_profile_id ? String(row.viewer_profile_id) : null,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
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
      };
    });

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
   * Creates a new comment or reply authored by a specific viewer profile
   */
  public async createComment(params: {
    episodeId: number;
    userId: string;
    viewerProfileId?: string | null;
    fallbackUsername?: string;
    content: string;
    isSpoiler?: boolean;
    parentId?: string | null;
  }): Promise<CommentItem> {
    const { episodeId, userId, viewerProfileId, fallbackUsername, content, isSpoiler = false, parentId = null } = params;

    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('El comentario no puede estar vacío.');
    }
    if (trimmed.length > 2000) {
      throw new Error('El comentario supera el límite de 2000 caracteres.');
    }

    await initTursoDatabase();
    const client = getTursoClient();

    // Check account status and role in Supabase
    const roleRes = await supabaseAdmin.from('user_roles').select('role, status').eq('user_id', userId).maybeSingle();
    if (roleRes.data?.status === 'banned') {
      throw new Error('Tu cuenta se encuentra suspendida. No puedes comentar.');
    }

    // Resolve viewer profile strictly
    let targetProfile: any;
    if (viewerProfileId) {
      // NOTE: getProfileById expects (profileId, accountId)
      const found = await viewerProfileService.getProfileById(viewerProfileId, userId);
      if (!found) {
        throw new Error('El perfil de espectador no pertenece a la cuenta autenticada.');
      }
      targetProfile = found;
    } else {
      targetProfile = await viewerProfileService.ensureDefaultProfile(userId, fallbackUsername);
    }

    const username = targetProfile.username || fallbackUsername || 'usuario';
    const displayName = targetProfile.display_name || fallbackUsername || targetProfile.name || username;
    const avatarUrl = targetProfile.avatar_url;
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
            (id, episode_id, user_id, viewer_profile_id, username, display_name, avatar_url, user_role, content, is_spoiler, is_deleted, parent_id, likes_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)`,
      args: [
        commentId,
        episodeId,
        userId,
        targetProfile.id,
        username,
        displayName,
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
      viewer_profile_id: targetProfile.id,
      username,
      display_name: displayName,
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
    };
  }

  /**
   * Toggles like state on a comment, isolated per viewer profile
   */
  public async toggleLike(
    commentId: string,
    accountId: string,
    viewerProfileId?: string | null
  ): Promise<{ liked: boolean; likes_count: number }> {
    await initTursoDatabase();
    const client = getTursoClient();

    let profileId: string;
    if (viewerProfileId) {
      const found = await viewerProfileService.getProfileById(viewerProfileId, accountId);
      if (!found) {
        throw new Error('El perfil de espectador no pertenece a la cuenta autenticada.');
      }
      profileId = found.id;
    } else {
      const def = await viewerProfileService.ensureDefaultProfile(accountId);
      profileId = def.id;
    }

    const existing = await client.execute({
      sql: `SELECT 1 FROM episode_comment_likes WHERE comment_id = ? AND viewer_profile_id = ?`,
      args: [commentId, profileId],
    });

    let liked = false;
    if (existing.rows.length > 0) {
      await client.batch(
        [
          {
            sql: `DELETE FROM episode_comment_likes WHERE comment_id = ? AND viewer_profile_id = ?`,
            args: [commentId, profileId],
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
            sql: `INSERT OR IGNORE INTO episode_comment_likes (comment_id, viewer_profile_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
            args: [commentId, profileId, accountId, now],
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

    // Check if it has replies
    const repliesCheck = await client.execute({
      sql: `SELECT COUNT(*) as count FROM episode_comments WHERE parent_id = ?`,
      args: [commentId],
    });

    const replyCount = Number(repliesCheck.rows[0]?.count || 0);

    if (replyCount > 0) {
      // Soft delete to preserve conversation branch
      await client.execute({
        sql: `UPDATE episode_comments SET is_deleted = 1, updated_at = ? WHERE id = ?`,
        args: [new Date().toISOString(), commentId],
      });
    } else {
      // Hard delete if it has no children
      await client.batch(
        [
          {
            sql: `DELETE FROM episode_comment_likes WHERE comment_id = ?`,
            args: [commentId],
          },
          {
            sql: `DELETE FROM episode_comments WHERE id = ?`,
            args: [commentId],
          },
        ],
        'write'
      );
    }
  }
}

export const commentService = new CommentService();
