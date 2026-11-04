import { Router } from 'express';
import { reactionController } from '../controllers/reaction.controller.js';
import { authenticateUser, optionalAuthenticateUser } from '../middlewares/jwtAuthGuard.js';

const router = Router();

router.get('/episode/:episodeId', optionalAuthenticateUser, (req, res) => reactionController.getReactions(req, res));
router.post('/episode/:episodeId', authenticateUser, (req, res) => reactionController.setReaction(req, res));

export default router;
