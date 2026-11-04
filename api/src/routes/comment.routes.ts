import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.js';
import { authenticateUser, optionalAuthenticateUser } from '../middlewares/jwtAuthGuard.js';

const router = Router();

router.get('/episode/:episodeId', optionalAuthenticateUser, (req, res) => commentController.getComments(req, res));
router.post('/episode/:episodeId', authenticateUser, (req, res) => commentController.postComment(req, res));
router.post('/:commentId/like', authenticateUser, (req, res) => commentController.toggleLike(req, res));
router.delete('/:commentId', authenticateUser, (req, res) => commentController.deleteComment(req, res));

export default router;
