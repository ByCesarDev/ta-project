import path from 'path';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface AvatarItem {
  id: number;
  filename: string;
  is_default: boolean;
  url: string;
  created_at: string;
  updated_at: string;
}

export class AvatarService {
  /**
   * Resolves content type by filename extension
   */
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.svg':
        return 'image/svg+xml';
      default:
        return 'image/png';
    }
  }

  /**
   * Fetches image buffer and content-type from Supabase Storage (acting as a privacy proxy)
   */
  public async getAvatarImage(rawFilename: string): Promise<{ buffer: Buffer; contentType: string }> {
    const cleanFilename = path.basename(rawFilename).trim();
    if (!cleanFilename || cleanFilename === '.' || cleanFilename === '..') {
      throw new Error('Nombre de archivo de avatar inválido');
    }

    try {
      const { data, error } = await supabaseAdmin.storage.from('avatars').download(cleanFilename);
      if (error || !data) {
        // Fallback to default avatar if not already requesting default
        if (cleanFilename !== 'default-avatar.png') {
          const { data: defaultData } = await supabaseAdmin.storage.from('avatars').download('default-avatar.png');
          if (defaultData) {
            const arrayBuffer = await defaultData.arrayBuffer();
            return {
              buffer: Buffer.from(arrayBuffer),
              contentType: 'image/png',
            };
          }
        }
        throw new Error(`Avatar no encontrado: ${cleanFilename}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: this.getContentType(cleanFilename),
      };
    } catch (err: any) {
      throw new Error(err.message || 'Error al obtener avatar');
    }
  }

  /**
   * Lists all available avatars from the database
   */
  public async listAvatars(): Promise<AvatarItem[]> {
    const { data, error } = await supabaseAdmin
      .from('avatars')
      .select('*')
      .order('is_default', { ascending: false })
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Error al listar avatares: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      filename: item.filename,
      is_default: Boolean(item.is_default),
      url: `/api/v1/avatars/${encodeURIComponent(item.filename)}`,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  /**
   * Updates a user's avatar filename in public.profiles
   */
  public async updateUserAvatar(userId: string, filename: string): Promise<any> {
    const cleanFilename = path.basename(filename).trim();
    if (!cleanFilename || cleanFilename === '.' || cleanFilename === '..') {
      throw new Error('Nombre de archivo de avatar inválido');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: cleanFilename,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    return data;
  }

  /**
   * Uploads multiple avatars to Supabase Storage and records them in public.avatars
   */
  public async uploadAvatars(files: Express.Multer.File[]): Promise<AvatarItem[]> {
    if (!files || files.length === 0) {
      throw new Error('No se enviaron archivos para subir');
    }

    const results: AvatarItem[] = [];

    for (const file of files) {
      const originalExt = path.extname(file.originalname).toLowerCase() || '.png';
      const cleanBase = path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueFilename = `${cleanBase}-${Date.now()}${originalExt}`;

      // 1. Upload to Supabase Storage bucket 'avatars'
      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(uniqueFilename, file.buffer, {
          contentType: file.mimetype || this.getContentType(uniqueFilename),
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error al subir imagen ${file.originalname}: ${uploadError.message}`);
      }

      // 2. Insert record in public.avatars
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('avatars')
        .insert({
          filename: uniqueFilename,
          is_default: false,
        })
        .select()
        .single();

      if (insertError) {
        // Rollback storage upload if insert fails
        await supabaseAdmin.storage.from('avatars').remove([uniqueFilename]);
        throw new Error(`Error al registrar avatar ${file.originalname}: ${insertError.message}`);
      }

      results.push({
        id: inserted.id,
        filename: inserted.filename,
        is_default: Boolean(inserted.is_default),
        url: `/api/v1/avatars/${encodeURIComponent(inserted.filename)}`,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
      });
    }

    return results;
  }

  /**
   * Sets an avatar as the system default
   */
  public async setDefaultAvatar(id: number): Promise<AvatarItem> {
    const { data: target, error: findError } = await supabaseAdmin
      .from('avatars')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError || !target) {
      throw new Error('Avatar no encontrado');
    }

    // 1. Clear previous default
    await supabaseAdmin
      .from('avatars')
      .update({ is_default: false })
      .neq('id', id);

    // 2. Set new default
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('avatars')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar avatar predeterminado: ${updateError.message}`);
    }

    return {
      id: updated.id,
      filename: updated.filename,
      is_default: true,
      url: `/api/v1/avatars/${encodeURIComponent(updated.filename)}`,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Deletes an avatar record and removes its physical file from Supabase Storage
   */
  public async deleteAvatar(id: number): Promise<{ success: boolean; message: string }> {
    const { data: avatar, error: findError } = await supabaseAdmin
      .from('avatars')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError || !avatar) {
      throw new Error('Avatar no encontrado');
    }

    if (avatar.is_default) {
      throw new Error('No se puede eliminar el avatar predeterminado del sistema');
    }

    // 1. Delete physical object from Supabase Storage
    await supabaseAdmin.storage.from('avatars').remove([avatar.filename]);

    // 2. Delete row from database
    const { error: deleteError } = await supabaseAdmin
      .from('avatars')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Error al eliminar registro de avatar: ${deleteError.message}`);
    }

    return { success: true, message: 'Avatar eliminado exitosamente' };
  }
}

export const avatarService = new AvatarService();
