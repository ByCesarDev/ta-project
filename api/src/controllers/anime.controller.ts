import { Request, Response, NextFunction } from 'express';
import { animeService } from '../services/anime.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AnimeController {
  public async listAnimes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const format = req.query.format as string;
      const sortBy = req.query.sortBy as any;

      const result = await animeService.listAnimes({
        page,
        limit,
        search,
        status,
        format,
        sortBy,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getAnimeByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawParam = req.params.idOrSlug || req.params.id || req.params.slug;
      const idOrSlug = String(Array.isArray(rawParam) ? rawParam[0] : rawParam || '').trim();

      if (!idOrSlug) {
        res.status(400).json({ error: 'BadRequest', message: 'Se requiere ID o slug del anime.' });
        return;
      }

      const anime = await animeService.getAnimeByIdOrSlug(idOrSlug);
      if (!anime) {
        res.status(404).json({ error: 'NotFound', message: 'Anime no encontrado.' });
        return;
      }

      res.status(200).json(anime);
    } catch (error) {
      next(error);
    }
  }

  public async createAnime(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await animeService.createAnime(req.body, req.user?.id);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  public async updateAnime(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = parseInt(String(Array.isArray(rawId) ? rawId[0] : rawId || ''), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'BadRequest', message: 'ID de anime inválido.' });
        return;
      }

      const updated = await animeService.updateAnime(id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteAnime(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = parseInt(String(Array.isArray(rawId) ? rawId[0] : rawId || ''), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'BadRequest', message: 'ID de anime inválido.' });
        return;
      }

      await animeService.deleteAnime(id);
      res.status(200).json({ success: true, message: `Anime ${id} eliminado exitosamente.` });
    } catch (error) {
      next(error);
    }
  }
}

export const animeController = new AnimeController();
