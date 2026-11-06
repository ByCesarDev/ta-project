import { Router } from 'express';
import { animeController } from '../controllers/anime.controller.js';
import { authenticateUser, requireModeratorOrAdmin, requireAdmin } from '../middlewares/jwtAuthGuard.js';

const router = Router();

// ==========================================
// Catalog & Anime Endpoints (Authenticated Users Only)
// ==========================================
// GET /api/v1/animes - List anime entries with pagination, status, and search filters
router.get('/', authenticateUser, animeController.listAnimes);

// GET /api/v1/animes/:idOrSlug - Get anime details by ID or Slug
router.get('/:idOrSlug', authenticateUser, animeController.getAnimeByIdOrSlug);

// ==========================================
// Staff Protected Routes
// ==========================================
// POST /api/v1/animes - Create new anime
router.post('/', requireModeratorOrAdmin, animeController.createAnime);

// PUT /api/v1/animes/:id - Update anime
router.put('/:id', requireModeratorOrAdmin, animeController.updateAnime);

// DELETE /api/v1/animes/:id - Delete anime (Admin only)
router.delete('/:id', requireAdmin, animeController.deleteAnime);

export default router;

