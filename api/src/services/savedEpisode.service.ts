import crypto from 'node:crypto';
import { getTursoClient, initTursoDatabase } from '../config/turso.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface SavedEpisodeItem {
  id: string;
  user_id: string;
  episode_id: number;
  anime_id?: number | null;
  series_id?: number | null;
  anime_slug: string;
  anime_title: string;
  episode_number: number;
  episode_title?: string | null;
  thumbnail?: string | null;
  duration?: string | null;
  created_at: string;
}

export class SavedEpisodeService {
  /**
   * Returns all saved episodes for a user
   */
  public async getSavedEpisodes(userId: string): Promise<SavedEpisodeItem[]> {
    await initTursoDatabase();
    const client = getTursoClient();

    const res = await client.execute({
      sql: `SELECT id, user_id, episode_id, anime_id, series_id, anime_slug, anime_title, 
                   episode_number, episode_title, thumbnail, duration, created_at 
            FROM user_saved_episodes 
            WHERE user_id = ? 
            ORDER BY created_at DESC`,
      args: [userId],
    });

    const items: SavedEpisodeItem[] = res.rows.map((r: any) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      episode_id: Number(r.episode_id),
      anime_id: r.anime_id ? Number(r.anime_id) : null,
      series_id: r.series_id ? Number(r.series_id) : null,
      anime_slug: String(r.anime_slug),
      anime_title: String(r.anime_title),
      episode_number: Number(r.episode_number),
      episode_title: r.episode_title ? String(r.episode_title) : null,
      thumbnail: r.thumbnail ? String(r.thumbnail) : null,
      duration: r.duration ? String(r.duration) : null,
      created_at: String(r.created_at),
    }));

    // Backfill any saved episodes that are missing a thumbnail from Supabase
    const missingThumbItems = items.filter((it) => !it.thumbnail || it.thumbnail.trim() === '');
    if (missingThumbItems.length > 0) {
      try {
        const epIds = missingThumbItems.map((it) => it.episode_id);
        const { data: eps } = await supabaseAdmin
          .from('episodes')
          .select('id, thumbnail, anime:animes(cover_image, banner_image)')
          .in('id', epIds);

        if (eps && eps.length > 0) {
          for (const ep of eps) {
            const resolvedThumb =
              ep.thumbnail ||
              (ep.anime as any)?.banner_image ||
              (ep.anime as any)?.cover_image ||
              null;

            if (resolvedThumb) {
              const target = items.find((it) => it.episode_id === ep.id);
              if (target) {
                target.thumbnail = resolvedThumb;
              }

              // Fire-and-forget update to Turso DB so subsequent requests are instant
              client.execute({
                sql: `UPDATE user_saved_episodes SET thumbnail = ? WHERE episode_id = ? AND (thumbnail IS NULL OR thumbnail = '')`,
                args: [resolvedThumb, ep.id],
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('[SavedEpisodeService] Failed to backfill missing thumbnails:', err);
      }
    }

    return items;
  }

  /**
   * Checks if an episode is saved by user
   */
  public async isEpisodeSaved(userId: string, episodeId: number): Promise<boolean> {
    await initTursoDatabase();
    const client = getTursoClient();

    const res = await client.execute({
      sql: `SELECT 1 FROM user_saved_episodes WHERE user_id = ? AND episode_id = ?`,
      args: [userId, episodeId],
    });

    return res.rows.length > 0;
  }

  /**
   * Toggles saved episode state
   */
  public async toggleSavedEpisode(
    userId: string,
    episodeId: number,
    metadata: {
      animeId?: number;
      seriesId?: number;
      animeSlug: string;
      animeTitle: string;
      episodeNumber: number;
      episodeTitle?: string | null;
      thumbnail?: string | null;
      duration?: string | null;
    }
  ): Promise<{ is_saved: boolean }> {
    await initTursoDatabase();
    const client = getTursoClient();

    const isSaved = await this.isEpisodeSaved(userId, episodeId);

    if (isSaved) {
      await client.execute({
        sql: `DELETE FROM user_saved_episodes WHERE user_id = ? AND episode_id = ?`,
        args: [userId, episodeId],
      });
      return { is_saved: false };
    } else {
      let resolvedThumbnail = metadata.thumbnail?.trim() || null;
      let resolvedDuration = metadata.duration?.trim() || null;

      if (!resolvedThumbnail) {
        try {
          const { data: epData } = await supabaseAdmin
            .from('episodes')
            .select('thumbnail, duration, anime:animes(cover_image, banner_image)')
            .eq('id', episodeId)
            .maybeSingle();

          if (epData) {
            resolvedThumbnail =
              epData.thumbnail ||
              (epData.anime as any)?.banner_image ||
              (epData.anime as any)?.cover_image ||
              null;
            if (!resolvedDuration && epData.duration) {
              resolvedDuration = `${epData.duration} min`;
            }
          }
        } catch (err) {
          console.error('[SavedEpisodeService] Failed to fetch episode metadata fallback:', err);
        }
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await client.execute({
        sql: `INSERT INTO user_saved_episodes 
              (id, user_id, episode_id, anime_id, series_id, anime_slug, anime_title, episode_number, episode_title, thumbnail, duration, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          userId,
          episodeId,
          metadata.animeId || null,
          metadata.seriesId || null,
          metadata.animeSlug,
          metadata.animeTitle,
          metadata.episodeNumber,
          metadata.episodeTitle || null,
          resolvedThumbnail,
          resolvedDuration,
          now,
        ],
      });
      return { is_saved: true };
    }
  }

  /**
   * Deletes a saved episode
   */
  public async removeSavedEpisode(userId: string, episodeId: number): Promise<void> {
    await initTursoDatabase();
    const client = getTursoClient();

    await client.execute({
      sql: `DELETE FROM user_saved_episodes WHERE user_id = ? AND episode_id = ?`,
      args: [userId, episodeId],
    });
  }
}

export const savedEpisodeService = new SavedEpisodeService();

