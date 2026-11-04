import { Response } from 'express';
import { reactionService } from '../services/reaction.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ReactionController {
  /**
   * GET /api/v1/reactions/episode/:episodeId
   */
  public async getReactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'ID de episodio inválido.' });
      return;
    }

    try {
      const viewerProfileId =
        (req.headers['x-viewer-profile-id'] as string) ||
        (req.query.viewer_profile_id as string) ||
        req.body?.viewer_profile_id;

      const stats = await reactionService.getEpisodeReactions(episodeId, req.user?.id, viewerProfileId);
      res.status(200).json({ success: true, ...stats });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'Error al obtener reacciones.' });
    }
  }

  /**
   * POST /api/v1/reactions/episode/:episodeId
   * Body: { reaction: 'like' | 'dislike' }
   */
  public async setReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Debes iniciar sesión para reaccionar.' });
      return;
    }

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'ID de episodio inválido.' });
      return;
    }

    const { reaction } = req.body;
    if (reaction !== 'like' && reaction !== 'dislike') {
      res.status(400).json({ error: 'BadRequest', message: 'Reacción inválida. Usa "like" o "dislike".' });
      return;
    }

    try {
      const viewerProfileId =
        (req.headers['x-viewer-profile-id'] as string) ||
        (req.query.viewer_profile_id as string) ||
        req.body?.viewer_profile_id;

      const updated = await reactionService.setEpisodeReaction(episodeId, userId, reaction, viewerProfileId);
      res.status(200).json({ success: true, ...updated });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'Error al guardar reacción.' });
    }
  }
}

export const reactionController = new ReactionController();

