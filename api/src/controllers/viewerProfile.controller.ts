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

      const { name, avatar_url } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'El nombre es obligatorio' });
        return;
      }

      const profile = await viewerProfileService.createProfile(user.id, {
        name,
        avatar_url,
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
      const { name, avatar_url } = req.body;

      const updated = await viewerProfileService.updateProfile(id, user.id, {
        name,
        avatar_url,
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
}

export const viewerProfileController = new ViewerProfileController();
