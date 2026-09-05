import { Router } from 'express';
import { streamController } from '../controllers/stream.controller.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';
import { optionalAuthenticateUser, requireModeratorOrAdmin } from '../middlewares/jwtAuthGuard.js';

const router = Router();

// GET /api/v1/stream/:animeSlug/:episodeNumber (Public with rate limiter & optional auth for staff refresh)
router.get('/:animeSlug/:episodeNumber', apiRateLimiter, optionalAuthenticateUser, streamController.getStreamSources);

// POST /api/v1/stream/validate-source (Staff only: validate URL against SSRF policy & host allowlist)
router.post('/validate-source', requireModeratorOrAdmin, streamController.validateSource);

// PUT /api/v1/stream/episodes/:episodeId/sources (Staff only: centralized episode sources synchronization)
router.put('/episodes/:episodeId/sources', requireModeratorOrAdmin, streamController.upsertEpisodeSources);

export default router;
