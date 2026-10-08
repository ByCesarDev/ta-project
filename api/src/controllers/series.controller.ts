import { Request, Response, NextFunction } from 'express';
import { seriesService } from '../services/series.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export class SeriesController {
  public async listSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 24;
      const search = req.query.search as string;
      const genreSlug = req.query.genreSlug as string;
      const status = req.query.status as string;
      const format = req.query.format as string;
      const sortBy = req.query.sortBy as any;

      const result = await seriesService.listSeries({
        page,
        limit,
        search,
        genreSlug,
        status,
        format,
        sortBy,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getSeriesBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = String(req.params.slug || '');
      const series = await seriesService.getSeriesBySlug(slug);

      if (!series) {
        res.status(404).json({
          error: 'NotFound',
          message: 'Serie no encontrada.',
        });
        return;
      }

      res.status(200).json(series);
    } catch (error) {
      next(error);
    }
  }

  public async createSeries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await seriesService.createSeries(req.body, req.user?.id);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  public async updateSeries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = await seriesService.updateSeries(id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteSeries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await seriesService.deleteSeries(id);
      res.status(200).json({ success: true, message: 'Serie eliminada con éxito.' });
    } catch (error) {
      next(error);
    }
  }

  public async createSeason(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seriesId = parseInt(String(req.params.seriesId), 10);
      const season = await seriesService.createSeason(seriesId, req.body);
      res.status(201).json(season);
    } catch (error) {
      next(error);
    }
  }

  public async updateSeason(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seasonId = parseInt(String(req.params.seasonId), 10);
      const updated = await seriesService.updateSeason(seasonId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteSeason(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seasonId = parseInt(String(req.params.seasonId), 10);
      const cascade = req.query.cascade === 'false' ? false : true;
      await seriesService.deleteSeason(seasonId, cascade);
      res.status(200).json({ success: true, message: 'Temporada eliminada con éxito.' });
    } catch (error) {
      next(error);
    }
  }

  public async deleteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = parseInt(String(req.params.entryId), 10);
      await seriesService.deleteEntry(entryId);
      res.status(200).json({ success: true, message: 'Entrega desvinculada con éxito.' });
    } catch (error) {
      next(error);
    }
  }

  public async createEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seasonId = parseInt(String(req.params.seasonId), 10);
      const entry = await seriesService.createEntry(seasonId, req.body);
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  }

  public async reassignEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = parseInt(String(req.params.entryId), 10);
      const { targetSeasonId, partLabel, displayOrder } = req.body;
      const entry = await seriesService.reassignEntry(entryId, targetSeasonId, partLabel, displayOrder);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  public async promoteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = parseInt(String(req.params.entryId), 10);
      const result = await seriesService.promoteEntryToSeries(entryId, req.body, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async importAniListEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await seriesService.importAniListEntryTransactional({
        ...req.body,
        userId: req.user?.id,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async combineSeries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sourceSeriesId, targetSeriesId } = req.body;
      const result = await seriesService.combineSeries(sourceSeriesId, targetSeriesId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async claimSeries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { error } = await supabaseAdmin.rpc('claim_series', { p_series_id: id });
      if (error) throw error;
      res.status(200).json({ success: true, message: 'Serie reclamada con éxito.' });
    } catch (error) {
      next(error);
    }
  }

  public async recordView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await supabaseAdmin.rpc('record_series_view', { p_series_id: id });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const seriesController = new SeriesController();
