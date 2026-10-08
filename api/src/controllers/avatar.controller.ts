import { Request, Response } from 'express';
import { avatarService } from '../services/avatar.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AvatarController {
  /**
   * Streams an avatar image from Supabase Storage (Privacy proxy)
   * GET /api/v1/avatars/:filename
   */
  public async getAvatar(req: Request, res: Response): Promise<void> {
    const rawFilename = req.params.filename;
    const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;

    if (!filename) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Filename is required.',
      });
      return;
    }

    try {
      const { buffer, contentType } = await avatarService.getAvatarImage(String(filename));

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.status(200).send(buffer);
    } catch (err: any) {
      res.status(404).json({
        error: 'NotFound',
        message: err.message || 'Avatar no encontrado',
      });
    }
  }

  /**
   * Lists all available avatars from the database
   * GET /api/v1/avatars
   */
  public async listAvatars(_req: Request, res: Response): Promise<void> {
    try {
      const avatars = await avatarService.listAvatars();
      res.status(200).json({
        success: true,
        avatars,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al listar avatares',
      });
    }
  }

  /**
   * Updates the current authenticated user's avatar
   * PATCH /api/v1/avatars/me
   */
  public async updateMyAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { filename } = req.body;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuario no autenticado.',
      });
      return;
    }

    if (!filename || typeof filename !== 'string') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Nombre de archivo de avatar requerido.',
      });
      return;
    }

    try {
      const cleanFilename = filename.split('/').pop()?.split('?')[0] || filename;
      const updated = await avatarService.updateUserAvatar(userId, cleanFilename);
      res.status(200).json({
        success: true,
        profile: updated,
        message: 'Avatar actualizado exitosamente.',
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al actualizar el avatar del usuario',
      });
    }
  }

  /**
   * Uploads multiple avatars (Admin/Mod)
   * POST /api/v1/avatars/upload
   */
  public async uploadAvatars(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          error: 'BadRequest',
          message: 'No se recibieron archivos para subir.',
        });
        return;
      }

      const avatars = await avatarService.uploadAvatars(files);
      res.status(201).json({
        success: true,
        avatars,
        message: `${avatars.length} avatar(es) subido(s) exitosamente.`,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al subir avatares',
      });
    }
  }

  /**
   * Sets an avatar as system default (Admin/Mod)
   * PATCH /api/v1/avatars/:id/default
   */
  public async setDefaultAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'ID de avatar inválido.',
      });
      return;
    }

    try {
      const avatar = await avatarService.setDefaultAvatar(id);
      res.status(200).json({
        success: true,
        avatar,
        message: 'Avatar predeterminado actualizado correctamente.',
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al establecer avatar predeterminado',
      });
    }
  }

  /**
   * Deletes an avatar (Admin only)
   * DELETE /api/v1/avatars/:id
   */
  public async deleteAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'ID de avatar inválido.',
      });
      return;
    }

    try {
      const result = await avatarService.deleteAvatar(id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.message?.includes('predeterminado') ? 400 : 500).json({
        error: 'OperationError',
        message: err.message || 'Error al eliminar avatar',
      });
    }
  }
}

export const avatarController = new AvatarController();
