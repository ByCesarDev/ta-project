import { describe, it, expect, beforeEach } from 'vitest';
import { commentService } from '../src/services/comment.service.js';
import { getTursoClient, initTursoDatabase } from '../src/config/turso.js';

describe('CommentService (Turso / SQLite)', () => {
  beforeEach(async () => {
    await initTursoDatabase();
    const client = getTursoClient();
    // Clean test tables
    await client.batch([
      `DELETE FROM episode_comment_likes`,
      `DELETE FROM episode_comments`
    ], 'write');
  });

  it('creates a comment and retrieves it for an episode', async () => {
    const created = await commentService.createComment({
      episodeId: 101,
      userId: 'user-uuid-1',
      fallbackUsername: 'GokuSan',
      content: '¡Qué épico este episodio!',
      isSpoiler: false,
    });

    expect(created.id).toBeDefined();
    expect(created.episode_id).toBe(101);
    expect(created.username).toBe('GokuSan');
    expect(created.content).toBe('¡Qué épico este episodio!');
    expect(created.is_spoiler).toBe(false);

    const fetched = await commentService.getCommentsByEpisode(101, 'user-uuid-1');
    expect(fetched.total_count).toBe(1);
    expect(fetched.comments.length).toBe(1);
    expect(fetched.comments[0].content).toBe('¡Qué épico este episodio!');
    expect(fetched.comments[0].is_liked_by_me).toBe(false);
  });

  it('supports replies and nests them properly in a thread', async () => {
    const parent = await commentService.createComment({
      episodeId: 102,
      userId: 'user-uuid-1',
      fallbackUsername: 'User1',
      content: 'Comentario principal',
    });

    const reply = await commentService.createComment({
      episodeId: 102,
      userId: 'user-uuid-2',
      fallbackUsername: 'User2',
      content: 'Totalmente de acuerdo contigo',
      parentId: parent.id,
    });

    expect(reply.parent_id).toBe(parent.id);

    const result = await commentService.getCommentsByEpisode(102);
    expect(result.total_count).toBe(2);
    expect(result.comments.length).toBe(1); // Only root comment
    expect(result.comments[0].replies?.length).toBe(1);
    expect(result.comments[0].replies?.[0].content).toBe('Totalmente de acuerdo contigo');
  });

  it('correctly manages spoiler flags', async () => {
    const spoiler = await commentService.createComment({
      episodeId: 103,
      userId: 'user-uuid-1',
      fallbackUsername: 'User1',
      content: 'Al final Meliodas es el líder de los Diez Mandamientos',
      isSpoiler: true,
    });

    expect(spoiler.is_spoiler).toBe(true);

    const result = await commentService.getCommentsByEpisode(103);
    expect(result.comments[0].is_spoiler).toBe(true);
  });

  it('toggles likes idempotently and updates counts', async () => {
    const comment = await commentService.createComment({
      episodeId: 104,
      userId: 'user-uuid-1',
      fallbackUsername: 'User1',
      content: 'Un gran anime',
    });

    // Like by User2
    const like1 = await commentService.toggleLike(comment.id, 'user-uuid-2');
    expect(like1.liked).toBe(true);
    expect(like1.likes_count).toBe(1);

    // Fetch as User2 -> should be liked_by_me
    const fetchUser2 = await commentService.getCommentsByEpisode(104, 'user-uuid-2');
    expect(fetchUser2.comments[0].is_liked_by_me).toBe(true);
    expect(fetchUser2.comments[0].likes_count).toBe(1);

    // Fetch as User1 -> should NOT be liked_by_me
    const fetchUser1 = await commentService.getCommentsByEpisode(104, 'user-uuid-1');
    expect(fetchUser1.comments[0].is_liked_by_me).toBe(false);

    // Unlike by User2
    const unlike = await commentService.toggleLike(comment.id, 'user-uuid-2');
    expect(unlike.liked).toBe(false);
    expect(unlike.likes_count).toBe(0);
  });

  it('soft deletes a comment if it has replies to preserve the thread', async () => {
    const parent = await commentService.createComment({
      episodeId: 105,
      userId: 'user-uuid-1',
      fallbackUsername: 'User1',
      content: 'Comentario con respuesta',
    });

    await commentService.createComment({
      episodeId: 105,
      userId: 'user-uuid-2',
      fallbackUsername: 'User2',
      content: 'Respuesta persistente',
      parentId: parent.id,
    });

    // Delete parent by owner
    await commentService.deleteComment(parent.id, 'user-uuid-1');

    const result = await commentService.getCommentsByEpisode(105);
    expect(result.comments.length).toBe(1);
    expect(result.comments[0].is_deleted).toBe(true);
    expect(result.comments[0].content).toBe('[Comentario eliminado]');
    expect(result.comments[0].replies?.length).toBe(1);
  });
});
