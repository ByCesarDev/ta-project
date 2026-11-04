import { Response } from 'express';
import { savedEpisodeService } from '../services/savedEpisode.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class SavedEpisodeController {
  /**
   * GET /api/v1/saved-episodes
   */
  public async getSavedEpisodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Debes iniciar sesión.' });
      return;
    }

    try {
      const episodes = await savedEpisodeService.getSavedEpisodes(userId);
      res.status(200).json({ success: true, episodes });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'Error al obtener episodios guardados.' });
    }
  }

  /**
   * GET /api/v1/saved-episodes/:episodeId/check
   */
  public async checkSaved(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);

    if (!userId) {
      res.status(200).json({ success: true, is_saved: false });
      return;
    }

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'ID de episodio inválido.' });
      return;
    }

    try {
      const isSaved = await savedEpisodeService.isEpisodeSaved(userId, episodeId);
      res.status(200).json({ success: true, is_saved: isSaved });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'Error al verificar guardado.' });
    }
  }

  /**
   * POST /api/v1/saved-episodes/:episodeId/toggle
   */
  public async toggleSaved(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Debes iniciar sesión para guardar episodios.' });
      return;
    }

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'ID de episodio inválido.' });
      return;
    }

    const { animeId, seriesId, animeSlug, animeTitle, episodeNumber, episodeTitle, thumbnail, duration } = req.body;

    if (!animeSlug || !animeTitle || typeof episodeNumber !== 'number') {
      res.status(400).json({ error: 'BadRequest', message: 'Metadatos de episodio incompletos.' });
      return;
    }

    try {
      const result = await savedEpisodeService.toggleSavedEpisode(userId, episodeId, {
        animeId,
        seriesId,
        animeSlug,
        animeTitle,
        episodeNumber,
        episodeTitle,
        thumbnail,
        duration,
      });

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'Error al guardar episodio.' });
    }
  }

  /**
   * DELETE /api/v1/saved-episodes/:episodeId
   */
  public async removeSaved(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const rawEpisodeId = req.params.episodeId;
    const episodeId = Number(Array.isArray(rawEpisodeId) ? rawEpisodeId[0] : rawEpisodeId);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Debes iniciar sesión.' });
      return;
    }

    if (isNaN(episodeId) || episodeId <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'ID de episodio inválido.' });
      return;
    }

    try {
      await savedEpisodeService.removeSavedEpisode(userId, episodeId);
      res.status(200).json({ success: true, message: 'Episodio eliminado de guardados.' });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'Error al eliminar episodio guardado.' });
    }
  }
}

export const savedEpisodeController = new SavedEpisodeController();

