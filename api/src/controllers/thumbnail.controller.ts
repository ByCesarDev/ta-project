import { Response } from 'express';
import { thumbnailService } from '../services/thumbnail.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ThumbnailController {
  /**
   * Generates a random frame thumbnail for a single episode (Admin/Mod)
   * POST /api/v1/episodes/:id/thumbnail/generate
   */
  public async generateEpisodeThumbnail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const episodeId = parseInt(String(rawId), 10);

    if (isNaN(episodeId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'ID de episodio inválido.',
      });
      return;
    }

    try {
      const result = await thumbnailService.generateEpisodeThumbnail(episodeId);

      if (!result.success) {
        res.status(400).json({
          error: 'ThumbnailGenerationFailed',
          message: result.error || 'No se pudo generar la portada del episodio.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        thumbnail_url: result.thumbnail_url,
        filename: result.filename,
        message: 'Portada de episodio generada exitosamente.',
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al generar la portada del episodio.',
      });
    }
  }

  /**
   * Bulk generates thumbnails for all episodes of an anime (Admin/Mod)
   * POST /api/v1/animes/:animeId/thumbnails/generate-all
   */
  public async generateAnimeThumbnails(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.animeId) ? req.params.animeId[0] : req.params.animeId;
    const animeId = parseInt(String(rawId), 10);

    if (isNaN(animeId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'ID de anime inválido.',
      });
      return;
    }

    try {
      const summary = await thumbnailService.generateAnimeThumbnailsBulk(animeId);
      res.status(200).json({
        success: true,
        summary,
        message: `Proceso completado: ${summary.successCount} portada(s) generada(s) de ${summary.total} episodios.`,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al generar portadas de los episodios.',
      });
    }
  }
}

export const thumbnailController = new ThumbnailController();
