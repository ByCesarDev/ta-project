import { Router } from 'express';
import { thumbnailController } from '../controllers/thumbnail.controller.js';
import { requireModeratorOrAdmin } from '../middlewares/jwtAuthGuard.js';

const thumbnailRouter = Router();

// Endpoint for single episode thumbnail generation
thumbnailRouter.post(
  '/episodes/:id/generate',
  ...requireModeratorOrAdmin,
  (req, res) => thumbnailController.generateEpisodeThumbnail(req, res)
);

// Endpoint for bulk anime episodes thumbnail generation
thumbnailRouter.post(
  '/animes/:animeId/generate-all',
  ...requireModeratorOrAdmin,
  (req, res) => thumbnailController.generateAnimeThumbnails(req, res)
);

export default thumbnailRouter;
