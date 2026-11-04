import { Response } from 'express';
import { commentService } from '../services/comment.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class CommentController {
  /**
   * GET /api/v1/comments/episode/:episodeId
   */
  public async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Identificador de episodio inválido.',
      });
      return;
    }

    try {
      const currentUserId = req.user?.id;
      const data = await commentService.getCommentsByEpisode(episodeId, currentUserId);
      res.status(200).json({
        success: true,
        ...data,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al obtener comentarios.',
      });
    }
  }

  /**
   * POST /api/v1/comments/episode/:episodeId
   */
  public async postComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Debes iniciar sesión para comentar.',
      });
      return;
    }

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Identificador de episodio inválido.',
      });
      return;
    }

    const { content, isSpoiler, parentId } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'El contenido del comentario es requerido.',
      });
      return;
    }

    const rawProfileHeader = req.headers['x-viewer-profile-id'];
    const viewerProfileId = (Array.isArray(rawProfileHeader) ? rawProfileHeader[0] : rawProfileHeader) || req.body?.viewerProfileId || null;

    try {
      const comment = await commentService.createComment({
        episodeId,
        userId,
        viewerProfileId,
        fallbackUsername: req.user?.username,
        content,
        isSpoiler: Boolean(isSpoiler),
        parentId: parentId ? String(parentId) : null,
      });

      res.status(201).json({
        success: true,
        comment,
      });
    } catch (err: any) {
      const statusCode = err.message?.includes('no existe') || err.message?.includes('vacío') ? 400 : 500;
      res.status(statusCode).json({
        error: statusCode === 400 ? 'BadRequest' : 'InternalServerError',
        message: err.message || 'Error al crear comentario.',
      });
    }
  }

  /**
   * POST /api/v1/comments/:commentId/like
   */
  public async toggleLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawCommentId = req.params.commentId;
    const commentId = Array.isArray(rawCommentId) ? rawCommentId[0] : rawCommentId;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Debes iniciar sesión para dar like.',
      });
      return;
    }

    if (!commentId) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Identificador de comentario requerido.',
      });
      return;
    }

    try {
      const result = await commentService.toggleLike(String(commentId), userId);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al procesar like.',
      });
    }
  }

  /**
   * DELETE /api/v1/comments/:commentId
   */
  public async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawCommentId = req.params.commentId;
    const commentId = Array.isArray(rawCommentId) ? rawCommentId[0] : rawCommentId;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Debes iniciar sesión para eliminar comentarios.',
      });
      return;
    }

    if (!commentId) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Identificador de comentario requerido.',
      });
      return;
    }

    try {
      await commentService.deleteComment(String(commentId), userId, req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Comentario eliminado exitosamente.',
      });
    } catch (err: any) {
      const statusCode = err.message?.includes('permisos') ? 403 : err.message?.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        error: statusCode === 403 ? 'Forbidden' : statusCode === 404 ? 'NotFound' : 'InternalServerError',
        message: err.message || 'Error al eliminar comentario.',
      });
    }
  }
}

export const commentController = new CommentController();
