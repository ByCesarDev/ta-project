import { Router } from 'express';
import { streamController } from '../controllers/stream.controller.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';
import { authenticateUser, requireModeratorOrAdmin } from '../middlewares/jwtAuthGuard.js';

const router = Router();

// GET /api/v1/stream/:animeSlug/:episodeNumber (Authenticated users only)
router.get('/:animeSlug/:episodeNumber', apiRateLimiter, authenticateUser, streamController.getStreamSources);

// GET /api/v1/stream/sources/:sourceId/resolve (Authenticated users only)
router.get('/sources/:sourceId/resolve', apiRateLimiter, authenticateUser, streamController.resolveSourceById);

// POST /api/v1/stream/resolve (Authenticated users only)
router.post('/resolve', apiRateLimiter, authenticateUser, streamController.resolveDirectSource);

// GET /api/v1/stream/proxy (High-performance video streaming proxy with Range support)
router.get('/proxy', streamController.proxyStream);

// POST /api/v1/stream/validate-source (Staff only: validate URL against SSRF policy & host allowlist)
router.post('/validate-source', requireModeratorOrAdmin, streamController.validateSource);

// PUT /api/v1/stream/episodes/:episodeId/sources (Staff only: centralized episode sources synchronization)
router.put('/episodes/:episodeId/sources', requireModeratorOrAdmin, streamController.upsertEpisodeSources);

export default router;
