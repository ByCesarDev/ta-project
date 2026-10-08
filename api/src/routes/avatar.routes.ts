import { Router } from 'express';
import multer from 'multer';
import { avatarController } from '../controllers/avatar.controller.js';
import { requireAdmin, requireAuth, requireModeratorOrAdmin } from '../middlewares/jwtAuthGuard.js';

const avatarRouter = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 20, // Max 20 files at once
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no soportado. Debe ser una imagen (PNG, JPG, WEBP, GIF, SVG).'));
    }
  },
});

// Authenticated user avatar update
avatarRouter.patch('/me', ...requireAuth, (req, res) => avatarController.updateMyAvatar(req, res));

// Public endpoints
avatarRouter.get('/', (req, res) => avatarController.listAvatars(req, res));
avatarRouter.get('/:filename', (req, res) => avatarController.getAvatar(req, res));

// Admin / Moderator management endpoints
avatarRouter.post(
  '/upload',
  ...requireModeratorOrAdmin,
  upload.array('files', 20),
  (req, res) => avatarController.uploadAvatars(req, res)
);

avatarRouter.patch(
  '/:id/default',
  ...requireModeratorOrAdmin,
  (req, res) => avatarController.setDefaultAvatar(req, res)
);

avatarRouter.delete(
  '/:id',
  ...requireAdmin,
  (req, res) => avatarController.deleteAvatar(req, res)
);

export default avatarRouter;
