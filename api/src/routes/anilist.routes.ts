import { Router } from 'express';
import { anilistController } from '../controllers/anilist.controller.js';
import { requireModeratorOrAdmin } from '../middlewares/jwtAuthGuard.js';
import { apiRateLimiter, strictRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// GET /api/v1/anilist/search?q=... - Public search for anime catalog
router.get('/search', apiRateLimiter, anilistController.search);

// GET /api/v1/anilist/details/:anilistId - Public anime details
router.get('/details/:anilistId', apiRateLimiter, anilistController.getDetails);

// POST /api/v1/anilist/import - Import anime from AniList (Protected: Mod/Admin)
router.post('/import', requireModeratorOrAdmin, strictRateLimiter, anilistController.importAnime);

export default router;
