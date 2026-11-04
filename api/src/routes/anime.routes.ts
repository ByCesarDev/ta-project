import { Router } from 'express';
import { animeController } from '../controllers/anime.controller.js';
import { requireModeratorOrAdmin, requireAdmin } from '../middlewares/jwtAuthGuard.js';

const router = Router();

// ==========================================
// Public Routes
// ==========================================
// GET /api/v1/animes - List anime entries with pagination, status, and search filters
router.get('/', animeController.listAnimes);

// GET /api/v1/animes/:idOrSlug - Get anime details by ID or Slug
router.get('/:idOrSlug', animeController.getAnimeByIdOrSlug);

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

