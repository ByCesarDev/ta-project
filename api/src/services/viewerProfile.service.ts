import crypto from 'node:crypto';
import { getTursoClient, initTursoDatabase } from '../config/turso.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface ViewerProfileItem {
  id: string;
  account_id: string;
  name: string;
  avatar_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export class ViewerProfileService {
  /**
   * Ensures that the account has at least one default viewer profile.
   * If not, it provisions a default profile based on their Supabase profile.
   */
  public async ensureDefaultProfile(accountId: string): Promise<ViewerProfileItem> {
    await initTursoDatabase();
    const client = getTursoClient();

    // Check if account already has any profile
    const existing = await client.execute({
      sql: `SELECT * FROM viewer_profiles WHERE account_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1`,
      args: [accountId],
    });

    if (existing.rows.length > 0) {
      const r: any = existing.rows[0];
      return {
        id: String(r.id),
        account_id: String(r.account_id),
        name: String(r.name),
        avatar_url: r.avatar_url ? String(r.avatar_url) : null,
        is_default: Boolean(r.is_default),
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
      };
    }

    // Lookup user in Supabase profiles
    let username = 'Principal';
    let avatarUrl: string | null = null;
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', accountId)
        .maybeSingle();

      if (userProfile?.username?.trim()) {
        username = userProfile.username.trim();
      }
      if (userProfile?.avatar_url?.trim()) {
        avatarUrl = userProfile.avatar_url.trim();
      }
    } catch {
      // ignore
    }

    // Default profile uses accountId as ID for 1:1 legacy backward-compatibility
    const profileId = accountId;
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO viewer_profiles (id, account_id, name, avatar_url, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)
            ON CONFLICT (id) DO UPDATE SET 
              name = excluded.name, 
              avatar_url = excluded.avatar_url, 
              is_default = 1,
              updated_at = excluded.updated_at`,
      args: [profileId, accountId, username, avatarUrl, now, now],
    });

    // Also try syncing to Supabase viewer_profiles table if it exists
    try {
      await supabaseAdmin.from('viewer_profiles').upsert({
        id: profileId,
        account_id: accountId,
        name: username,
        avatar_url: avatarUrl,
        is_default: true,
        created_at: now,
        updated_at: now,
      });
    } catch {
      // Table may still be in migration
    }

    return {
      id: profileId,
      account_id: accountId,
      name: username,
      avatar_url: avatarUrl,
      is_default: true,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Retrieves all viewer profiles belonging to the given account
   */
  public async getProfilesByAccount(accountId: string): Promise<ViewerProfileItem[]> {
    await initTursoDatabase();
    const client = getTursoClient();

    // Ensure default profile exists first
    await this.ensureDefaultProfile(accountId);

    const res = await client.execute({
      sql: `SELECT id, account_id, name, avatar_url, is_default, created_at, updated_at 
            FROM viewer_profiles 
            WHERE account_id = ? 
            ORDER BY is_default DESC, created_at ASC`,
      args: [accountId],
    });

    return res.rows.map((r: any) => ({
      id: String(r.id),
      account_id: String(r.account_id),
      name: String(r.name),
      avatar_url: r.avatar_url ? String(r.avatar_url) : null,
      is_default: Boolean(r.is_default),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }));
  }

  /**
   * Fetches a specific profile by ID and verifies it belongs to the given account
   */
  public async getProfileById(profileId: string, accountId: string): Promise<ViewerProfileItem | null> {
    await initTursoDatabase();
    const client = getTursoClient();

    const res = await client.execute({
      sql: `SELECT id, account_id, name, avatar_url, is_default, created_at, updated_at 
            FROM viewer_profiles 
            WHERE id = ? AND account_id = ?`,
      args: [profileId, accountId],
    });

    if (res.rows.length === 0) {
      return null;
    }

    const r: any = res.rows[0];
    return {
      id: String(r.id),
      account_id: String(r.account_id),
      name: String(r.name),
      avatar_url: r.avatar_url ? String(r.avatar_url) : null,
      is_default: Boolean(r.is_default),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    };
  }

  /**
   * Validates if a viewerProfileId belongs to the account.
   * If profileId is not supplied, returns the account's default profile ID.
   */
  public async resolveValidatedProfileId(accountId: string, profileId?: string | null): Promise<string> {
    if (profileId && profileId.trim()) {
      const profile = await this.getProfileById(profileId.trim(), accountId);
      if (profile) return profile.id;
    }

    // Fallback to default profile
    const defaultProfile = await this.ensureDefaultProfile(accountId);
    return defaultProfile.id;
  }

  /**
   * Creates a new viewer profile for the account (max 5 per account)
   */
  public async createProfile(
    accountId: string,
    data: { name: string; avatar_url?: string | null }
  ): Promise<ViewerProfileItem> {
    await initTursoDatabase();
    const client = getTursoClient();

    const cleanName = data.name?.trim();
    if (!cleanName || cleanName.length === 0) {
      throw new Error('El nombre del perfil no puede estar vacío.');
    }
    if (cleanName.length > 40) {
      throw new Error('El nombre del perfil no puede superar los 40 caracteres.');
    }

    // Check count constraint (max 5)
    const countRes = await client.execute({
      sql: `SELECT COUNT(*) as count FROM viewer_profiles WHERE account_id = ?`,
      args: [accountId],
    });
    const currentCount = Number(countRes.rows[0]?.count || 0);
    if (currentCount >= 5) {
      throw new Error('Límite alcanzado: cada cuenta puede tener como máximo 5 perfiles.');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const avatarUrl = data.avatar_url?.trim() || null;

    await client.execute({
      sql: `INSERT INTO viewer_profiles (id, account_id, name, avatar_url, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, ?, ?)`,
      args: [id, accountId, cleanName, avatarUrl, now, now],
    });

    // Sync to Supabase
    try {
      await supabaseAdmin.from('viewer_profiles').insert({
        id,
        account_id: accountId,
        name: cleanName,
        avatar_url: avatarUrl,
        is_default: false,
        created_at: now,
        updated_at: now,
      });
    } catch {
      // ignore
    }

    return {
      id,
      account_id: accountId,
      name: cleanName,
      avatar_url: avatarUrl,
      is_default: false,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Updates an existing viewer profile
   */
  public async updateProfile(
    profileId: string,
    accountId: string,
    data: { name?: string; avatar_url?: string | null }
  ): Promise<ViewerProfileItem> {
    await initTursoDatabase();
    const client = getTursoClient();

    const existing = await this.getProfileById(profileId, accountId);
    if (!existing) {
      throw new Error('Perfil no encontrado o no tienes permiso para editarlo.');
    }

    let newName = existing.name;
    if (data.name !== undefined) {
      const clean = data.name.trim();
      if (!clean) throw new Error('El nombre no puede estar vacío.');
      if (clean.length > 40) throw new Error('El nombre no puede superar los 40 caracteres.');
      newName = clean;
    }

    let newAvatar = existing.avatar_url;
    if (data.avatar_url !== undefined) {
      newAvatar = data.avatar_url?.trim() || null;
    }

    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE viewer_profiles SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ? AND account_id = ?`,
      args: [newName, newAvatar, now, profileId, accountId],
    });

    // Sync to Supabase
    try {
      await supabaseAdmin
        .from('viewer_profiles')
        .update({
          name: newName,
          avatar_url: newAvatar,
          updated_at: now,
        })
        .eq('id', profileId)
        .eq('account_id', accountId);
    } catch {
      // ignore
    }

    return {
      ...existing,
      name: newName,
      avatar_url: newAvatar,
      updated_at: now,
    };
  }

  /**
   * Deletes a viewer profile (default profile cannot be deleted)
   */
  public async deleteProfile(profileId: string, accountId: string): Promise<void> {
    await initTursoDatabase();
    const client = getTursoClient();

    const existing = await this.getProfileById(profileId, accountId);
    if (!existing) {
      throw new Error('Perfil no encontrado o no tienes permiso para eliminarlo.');
    }

    if (existing.is_default) {
      throw new Error('No es posible eliminar el perfil principal de la cuenta.');
    }

    // 1. Delete associated data in Turso for this specific profile
    await client.batch([
      {
        sql: `DELETE FROM user_saved_episodes WHERE viewer_profile_id = ?`,
        args: [profileId],
      },
      {
        sql: `DELETE FROM episode_reactions WHERE viewer_profile_id = ?`,
        args: [profileId],
      },
      {
        sql: `DELETE FROM viewer_profiles WHERE id = ? AND account_id = ?`,
        args: [profileId, accountId],
      },
    ], 'write');

    // 2. Cascade delete in Supabase
    try {
      await Promise.all([
        supabaseAdmin.from('user_history').delete().eq('viewer_profile_id', profileId),
        supabaseAdmin.from('user_favorites').delete().eq('viewer_profile_id', profileId),
        supabaseAdmin.from('watch_later').delete().eq('viewer_profile_id', profileId),
        supabaseAdmin.from('user_episode_status').delete().eq('viewer_profile_id', profileId),
        supabaseAdmin.from('viewer_profiles').delete().eq('id', profileId).eq('account_id', accountId),
      ]);
    } catch {
      // ignore
    }
  }
}

export const viewerProfileService = new ViewerProfileService();

