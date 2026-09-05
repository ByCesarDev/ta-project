import { Router } from 'express';
import { streamController } from '../controllers/stream.controller.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';
import { optionalAuthenticateUser } from '../middlewares/jwtAuthGuard.js';

const router = Router();

// GET /api/v1/stream/:animeSlug/:episodeNumber (Public with rate limiter & optional auth for staff refresh)
router.get('/:animeSlug/:episodeNumber', apiRateLimiter, optionalAuthenticateUser, streamController.getStreamSources);

export default router;
