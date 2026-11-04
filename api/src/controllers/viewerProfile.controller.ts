import { Request, Response } from 'express';
import { viewerProfileService } from '../services/viewerProfile.service.js';

export class ViewerProfileController {
  /**
   * GET /api/v1/viewer-profiles
   */
  public async getProfiles(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const profiles = await viewerProfileService.getProfilesByAccount(user.id);
      res.json({ profiles });
    } catch (err: any) {
      console.error('[ViewerProfileController] Error getting profiles:', err);
      res.status(500).json({ error: err.message || 'Error al obtener perfiles' });
    }
  }

  /**
   * POST /api/v1/viewer-profiles
   */
  public async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const { name, display_name, username, avatar_url, bio } = req.body;
      const effectiveName = display_name || name;
      if (!effectiveName || typeof effectiveName !== 'string') {
        res.status(400).json({ error: 'El nombre es obligatorio' });
        return;
      }

      const profile = await viewerProfileService.createProfile(user.id, {
        name: effectiveName,
        display_name: effectiveName,
        username,
        avatar_url,
        bio,
      });

      res.status(201).json({ profile });
    } catch (err: any) {
      console.error('[ViewerProfileController] Error creating profile:', err);
      res.status(400).json({ error: err.message || 'Error al crear perfil' });
    }
  }

  /**
   * PATCH /api/v1/viewer-profiles/:id
   */
  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const { name, display_name, username, avatar_url, bio } = req.body;

      const updated = await viewerProfileService.updateProfile(id, user.id, {
        name: display_name || name,
        display_name: display_name || name,
        username,
        avatar_url,
        bio,
      });

      res.json({ profile: updated });
    } catch (err: any) {
      console.error('[ViewerProfileController] Error updating profile:', err);
      res.status(400).json({ error: err.message || 'Error al actualizar perfil' });
    }
  }

  /**
   * DELETE /api/v1/viewer-profiles/:id
   */
  public async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      await viewerProfileService.deleteProfile(id, user.id);

      res.json({ success: true, message: 'Perfil eliminado correctamente' });
    } catch (err: any) {
      console.error('[ViewerProfileController] Error deleting profile:', err);
      res.status(400).json({ error: err.message || 'Error al eliminar perfil' });
    }
  }

  /**
   * GET /api/v1/viewer-profiles/public/:identifier
   */
  public async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const rawIdentifier = req.params.identifier;
      const identifier = Array.isArray(rawIdentifier) ? rawIdentifier[0] : rawIdentifier;

      if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        res.status(400).json({
          error: 'BadRequest',
          message: 'Identificador o nombre de usuario inválido.',
        });
        return;
      }

      const profile = await viewerProfileService.getPublicProfile(identifier.trim());
      if (!profile) {
        res.status(404).json({
          error: 'NotFound',
          message: 'Perfil de usuario no encontrado.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        profile,
      });
    } catch (err: any) {
      console.error('[ViewerProfileController] Error getting public profile:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Error al obtener perfil público.',
      });
    }
  }
}

export const viewerProfileController = new ViewerProfileController();
