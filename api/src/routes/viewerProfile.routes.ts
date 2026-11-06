import { Router } from 'express';
import { authenticateUser } from '../middlewares/jwtAuthGuard.js';
import { viewerProfileController } from '../controllers/viewerProfile.controller.js';

const router = Router();

// Community public profile endpoint (requires authenticated platform user)
router.get('/public/:identifier', authenticateUser, (req, res) => viewerProfileController.getPublicProfile(req, res));

router.get('/', authenticateUser, (req, res) => viewerProfileController.getProfiles(req, res));
router.post('/', authenticateUser, (req, res) => viewerProfileController.createProfile(req, res));
router.patch('/:id', authenticateUser, (req, res) => viewerProfileController.updateProfile(req, res));
router.delete('/:id', authenticateUser, (req, res) => viewerProfileController.deleteProfile(req, res));

export default router;

