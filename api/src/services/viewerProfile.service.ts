import crypto from 'node:crypto';
import { getTursoClient, initTursoDatabase } from '../config/turso.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface ViewerProfileItem {
  id: string;
  account_id: string;
  name: string; // Compatible with legacy code, identical to display_name
  display_name: string;
  username: string; // Unique public handle, e.g. "nelis"
  avatar_url: string | null;
  bio?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export class ViewerProfileService {
  /**
   * Normalizes a raw string into a clean lowercase username handle.
   */
  public normalizeUsername(raw: string): string {
    const clean = raw
      .toLowerCase()
      .trim()
      .replace(/^@+/, '')
      .replace(/[\s\-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    return clean;
  }

  /**
   * Validates format of username: lowercase, letters, numbers, underscores, 3-25 chars.
   */
  public validateUsernameFormat(username: string): void {
    if (!username || username.length < 3) {
      throw new Error('El nombre de usuario (@username) debe tener al menos 3 caracteres.');
    }
    if (username.length > 25) {
      throw new Error('El nombre de usuario (@username) no puede superar los 25 caracteres.');
    }
    if (!/^[a-z0-9_]{3,25}$/.test(username)) {
      throw new Error('El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos (_).');
    }
  }

  /**
   * Generates a unique username handle from a base string by appending digits if collision occurs.
   */
  public async generateUniqueUsername(client: any, baseRaw: string, excludeProfileId?: string): Promise<string> {
    let base = this.normalizeUsername(baseRaw);
    if (base.length < 3) {
      base = `user_${base}`.slice(0, 20);
    }
    if (base.length > 20) {
      base = base.slice(0, 20);
    }

    let candidate = base;
    let counter = 1;

    while (true) {
      const sql = excludeProfileId
        ? `SELECT id FROM viewer_profiles WHERE LOWER(username) = ? AND id != ?`
        : `SELECT id FROM viewer_profiles WHERE LOWER(username) = ?`;
      const args = excludeProfileId ? [candidate, excludeProfileId] : [candidate];

      const res = await client.execute({ sql, args });
      if (res.rows.length === 0) {
        return candidate;
      }
      candidate = `${base.slice(0, 18)}_${counter++}`;
    }
  }

  /**
   * Ensures that the account has at least one default viewer profile.
   * If not, it provisions a default profile based on their Supabase profile.
   */
  public async ensureDefaultProfile(accountId: string, fallbackUsername?: string): Promise<ViewerProfileItem> {
    await initTursoDatabase();
    const client = getTursoClient();

    // Check if account already has any profile
    const existing = await client.execute({
      sql: `SELECT * FROM viewer_profiles WHERE account_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1`,
      args: [accountId],
    });

    if (existing.rows.length > 0) {
      const r: any = existing.rows[0];
      const displayName = String(r.display_name || r.name || fallbackUsername || 'Principal');
      let username = String(r.username || '');
      if (!username) {
        username = await this.generateUniqueUsername(client, displayName, String(r.id));
        await client.execute({
          sql: `UPDATE viewer_profiles SET username = ?, display_name = ? WHERE id = ?`,
          args: [username, displayName, String(r.id)],
        });
      }

      return {
        id: String(r.id),
        account_id: String(r.account_id),
        name: displayName,
        display_name: displayName,
        username,
        avatar_url: r.avatar_url ? String(r.avatar_url) : null,
        bio: r.bio ? String(r.bio) : null,
        is_default: Boolean(r.is_default),
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
      };
    }

    // Lookup user in Supabase profiles
    let accountUsername = fallbackUsername || 'Principal';
    let avatarUrl: string | null = null;
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', accountId)
        .maybeSingle();

      if (userProfile?.username?.trim()) {
        accountUsername = userProfile.username.trim();
      }
      if (userProfile?.avatar_url?.trim()) {
        avatarUrl = userProfile.avatar_url.trim();
      }
    } catch {
      // ignore
    }

    const displayName = accountUsername;
    const cleanHandle = await this.generateUniqueUsername(client, accountUsername);
    const profileId = accountId;
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO viewer_profiles (id, account_id, name, display_name, username, avatar_url, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            ON CONFLICT (id) DO UPDATE SET 
              name = excluded.name, 
              display_name = excluded.display_name,
              username = excluded.username,
              avatar_url = excluded.avatar_url, 
              is_default = 1,
              updated_at = excluded.updated_at`,
      args: [profileId, accountId, displayName, displayName, cleanHandle, avatarUrl, now, now],
    });

    // Also try syncing to Supabase viewer_profiles table if it exists
    try {
      const { error } = await supabaseAdmin.from('viewer_profiles').upsert({
        id: profileId,
        account_id: accountId,
        name: displayName,
        display_name: displayName,
        username: cleanHandle,
        avatar_url: avatarUrl,
        bio: null,
        is_default: true,
        created_at: now,
        updated_at: now,
      });
      if (error) {
        console.warn(`[ViewerProfileService] Supabase sync upsert error for profile ${profileId}:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[ViewerProfileService] Supabase sync unexpected error for profile ${profileId}:`, err?.message);
    }

    return {
      id: profileId,
      account_id: accountId,
      name: displayName,
      display_name: displayName,
      username: cleanHandle,
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
      sql: `SELECT id, account_id, name, display_name, username, avatar_url, bio, is_default, created_at, updated_at 
            FROM viewer_profiles 
            WHERE account_id = ? 
            ORDER BY is_default DESC, created_at ASC`,
      args: [accountId],
    });

    return res.rows.map((r: any) => {
      const displayName = String(r.display_name || r.name || 'Perfil');
      const username = String(r.username || '');
      return {
        id: String(r.id),
        account_id: String(r.account_id),
        name: displayName,
        display_name: displayName,
        username,
        avatar_url: r.avatar_url ? String(r.avatar_url) : null,
        bio: r.bio ? String(r.bio) : null,
        is_default: Boolean(r.is_default),
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
      };
    });
  }

  /**
   * Fetches a specific profile by ID and verifies it belongs to the given account
   */
  public async getProfileById(profileId: string, accountId: string): Promise<ViewerProfileItem | null> {
    await initTursoDatabase();
    const client = getTursoClient();

    const res = await client.execute({
      sql: `SELECT id, account_id, name, display_name, username, avatar_url, bio, is_default, created_at, updated_at 
            FROM viewer_profiles 
            WHERE id = ? AND account_id = ?`,
      args: [profileId, accountId],
    });

    if (res.rows.length === 0) {
      return null;
    }

    const r: any = res.rows[0];
    const displayName = String(r.display_name || r.name || 'Perfil');
    return {
      id: String(r.id),
      account_id: String(r.account_id),
      name: displayName,
      display_name: displayName,
      username: String(r.username || ''),
      avatar_url: r.avatar_url ? String(r.avatar_url) : null,
      bio: r.bio ? String(r.bio) : null,
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
    data: { name?: string; display_name?: string; username?: string; avatar_url?: string | null; bio?: string | null }
  ): Promise<ViewerProfileItem> {
    await initTursoDatabase();
    const client = getTursoClient();

    const cleanDisplayName = (data.display_name || data.name || '').trim();
    if (!cleanDisplayName || cleanDisplayName.length === 0) {
      throw new Error('El nombre del perfil no puede estar vacío.');
    }
    if (cleanDisplayName.length > 40) {
      throw new Error('El nombre del perfil no puede superar los 40 caracteres.');
    }

    const cleanBio = data.bio ? data.bio.trim() : null;
    if (cleanBio && cleanBio.length > 250) {
      throw new Error('La biografía no puede superar los 250 caracteres.');
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

    // Handle username
    let cleanHandle: string;
    if (data.username && data.username.trim()) {
      cleanHandle = this.normalizeUsername(data.username);
      this.validateUsernameFormat(cleanHandle);

      // Check global uniqueness
      const existing = await client.execute({
        sql: `SELECT id FROM viewer_profiles WHERE LOWER(username) = ?`,
        args: [cleanHandle],
      });
      if (existing.rows.length > 0) {
        throw new Error(`El nombre de usuario @${cleanHandle} ya está en uso. Por favor elige otro.`);
      }
    } else {
      cleanHandle = await this.generateUniqueUsername(client, cleanDisplayName);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const avatarUrl = data.avatar_url?.trim() || null;

    await client.execute({
      sql: `INSERT INTO viewer_profiles (id, account_id, name, display_name, username, avatar_url, bio, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [id, accountId, cleanDisplayName, cleanDisplayName, cleanHandle, avatarUrl, cleanBio ?? null, now, now],
    });

    // Sync to Supabase
    try {
      const { error } = await supabaseAdmin.from('viewer_profiles').insert({
        id,
        account_id: accountId,
        name: cleanDisplayName,
        display_name: cleanDisplayName,
        username: cleanHandle,
        avatar_url: avatarUrl,
        bio: cleanBio,
        is_default: false,
        created_at: now,
        updated_at: now,
      });
      if (error) {
        console.warn(`[ViewerProfileService] Supabase sync insert error for profile ${id}:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[ViewerProfileService] Supabase sync unexpected error for profile ${id}:`, err?.message);
    }

    return {
      id,
      account_id: accountId,
      name: cleanDisplayName,
      display_name: cleanDisplayName,
      username: cleanHandle,
      avatar_url: avatarUrl,
      bio: cleanBio,
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
    data: { name?: string; display_name?: string; username?: string; avatar_url?: string | null; bio?: string | null }
  ): Promise<ViewerProfileItem> {
    await initTursoDatabase();
    const client = getTursoClient();

    const existing = await this.getProfileById(profileId, accountId);
    if (!existing) {
      throw new Error('Perfil no encontrado o no tienes permiso para editarlo.');
    }

    let newDisplayName = existing.display_name;
    const rawDisplayName = data.display_name !== undefined ? data.display_name : data.name;
    if (rawDisplayName !== undefined) {
      const clean = rawDisplayName.trim();
      if (!clean) throw new Error('El nombre no puede estar vacío.');
      if (clean.length > 40) throw new Error('El nombre no puede superar los 40 caracteres.');
      newDisplayName = clean;
    }

    let newUsername = existing.username;
    if (data.username !== undefined && data.username.trim()) {
      const cleanHandle = this.normalizeUsername(data.username);
      this.validateUsernameFormat(cleanHandle);

      if (cleanHandle !== existing.username.toLowerCase()) {
        const check = await client.execute({
          sql: `SELECT id FROM viewer_profiles WHERE LOWER(username) = ? AND id != ?`,
          args: [cleanHandle, profileId],
        });
        if (check.rows.length > 0) {
          throw new Error(`El nombre de usuario @${cleanHandle} ya está en uso. Elige otro.`);
        }
        newUsername = cleanHandle;
      }
    }

    let newAvatar = existing.avatar_url;
    if (data.avatar_url !== undefined) {
      newAvatar = data.avatar_url?.trim() || null;
    }

    let newBio = existing.bio;
    if (data.bio !== undefined) {
      const clean = (data.bio || '').trim();
      if (clean.length > 250) {
        throw new Error('La biografía no puede superar los 250 caracteres.');
      }
      newBio = clean || null;
    }

    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE viewer_profiles 
            SET name = ?, display_name = ?, username = ?, avatar_url = ?, bio = ?, updated_at = ? 
            WHERE id = ? AND account_id = ?`,
      args: [newDisplayName, newDisplayName, newUsername, newAvatar ?? null, newBio ?? null, now, profileId, accountId],
    });

    // Sync to Supabase
    try {
      const { error } = await supabaseAdmin
        .from('viewer_profiles')
        .update({
          name: newDisplayName,
          display_name: newDisplayName,
          username: newUsername,
          avatar_url: newAvatar,
          bio: newBio,
          updated_at: now,
        })
        .eq('id', profileId)
        .eq('account_id', accountId);
      if (error) {
        console.warn(`[ViewerProfileService] Supabase sync update error for profile ${profileId}:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[ViewerProfileService] Supabase sync unexpected error for profile ${profileId}:`, err?.message);
    }

    return {
      ...existing,
      name: newDisplayName,
      display_name: newDisplayName,
      username: newUsername,
      avatar_url: newAvatar,
      bio: newBio,
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
        sql: `DELETE FROM episode_comment_likes WHERE viewer_profile_id = ?`,
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
