import { Router } from 'express';
import { savedEpisodeController } from '../controllers/savedEpisode.controller.js';
import { authenticateUser, optionalAuthenticateUser } from '../middlewares/jwtAuthGuard.js';

const router = Router();

router.get('/', authenticateUser, (req, res) => savedEpisodeController.getSavedEpisodes(req, res));
router.get('/:episodeId/check', optionalAuthenticateUser, (req, res) => savedEpisodeController.checkSaved(req, res));
router.post('/:episodeId/toggle', authenticateUser, (req, res) => savedEpisodeController.toggleSaved(req, res));
router.delete('/:episodeId', authenticateUser, (req, res) => savedEpisodeController.removeSaved(req, res));

export default router;
