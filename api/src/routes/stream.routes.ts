import { Router } from 'express';
import { streamController } from '../controllers/stream.controller.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// GET /api/v1/stream/:animeSlug/:episodeNumber
router.get('/:animeSlug/:episodeNumber', apiRateLimiter, streamController.getStreamSources);

export default router;
