import { Router } from 'express';
import { seriesController } from '../controllers/series.controller.js';
import { requireModeratorOrAdmin, requireAdmin } from '../middlewares/jwtAuthGuard.js';

const router = Router();

// ==========================================
// Public Routes
// ==========================================
// GET /api/v1/series - List series with pagination and filters
router.get('/', seriesController.listSeries);

// GET /api/v1/series/:slug - Get full series details by slug
router.get('/:slug', seriesController.getSeriesBySlug);

// POST /api/v1/series/:id/view - Increment view count
router.post('/:id/view', seriesController.recordView);

// ==========================================
// Moderator & Admin Protected Routes
// ==========================================
// POST /api/v1/series - Create new series
router.post('/', requireModeratorOrAdmin, seriesController.createSeries);

// PUT /api/v1/series/:id - Update series
router.put('/:id', requireModeratorOrAdmin, seriesController.updateSeries);

// POST /api/v1/series/:id/claim - Claim series for moderation
router.post('/:id/claim', requireModeratorOrAdmin, seriesController.claimSeries);

// POST /api/v1/series/import-anilist - Transactional AniList import & binding
router.post('/import-anilist', requireModeratorOrAdmin, seriesController.importAniListEntry);

// Seasons management
// POST /api/v1/series/:seriesId/seasons - Create season
router.post('/:seriesId/seasons', requireModeratorOrAdmin, seriesController.createSeason);

// PUT /api/v1/series/seasons/:seasonId - Update season
router.put('/seasons/:seasonId', requireModeratorOrAdmin, seriesController.updateSeason);

// Entries management
// POST /api/v1/series/seasons/:seasonId/entries - Link anime entry to season
router.post('/seasons/:seasonId/entries', requireModeratorOrAdmin, seriesController.createEntry);

// POST /api/v1/series/entries/:entryId/reassign - Move entry to another season
router.post('/entries/:entryId/reassign', requireModeratorOrAdmin, seriesController.reassignEntry);

// POST /api/v1/series/entries/:entryId/promote - Promote entry to independent series
router.post('/entries/:entryId/promote', requireModeratorOrAdmin, seriesController.promoteEntry);

// DELETE /api/v1/series/seasons/:seasonId - Delete season (cascade supported)
router.delete('/seasons/:seasonId', requireModeratorOrAdmin, seriesController.deleteSeason);

// DELETE /api/v1/series/entries/:entryId - Delete entry binding
router.delete('/entries/:entryId', requireModeratorOrAdmin, seriesController.deleteEntry);

// ==========================================
// Admin Only Protected Routes
// ==========================================
// DELETE /api/v1/series/:id - Delete series (ON DELETE RESTRICT)
router.delete('/:id', requireAdmin, seriesController.deleteSeries);

// POST /api/v1/series/combine - Atomic merge of two series
router.post('/combine', requireAdmin, seriesController.combineSeries);

export default router;
