import { Response } from 'express';
import { anilistService } from '../services/anilist.service.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AniListController {
  /**
   * GET /api/v1/anilist/search?q=...&page=1
   * Live search for anime via AniList GraphQL
   */
  public async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    const query = (req.query.q as string)?.trim();
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string, 10) : 10;

    if (!query) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Search query parameter "q" is required.',
      });
      return;
    }

    try {
      const result = await anilistService.searchAnime(query, page, perPage);
      res.status(200).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AniList search failed';
      res.status(500).json({
        error: 'AniListError',
        message,
      });
    }
  }

  /**
   * GET /api/v1/anilist/details/:anilistId
   * Fetches raw details from AniList
   */
  public async getDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.anilistId) ? req.params.anilistId[0] : req.params.anilistId;
    const anilistId = parseInt(String(rawId), 10);

    if (isNaN(anilistId)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid anilistId parameter.',
      });
      return;
    }

    try {
      const media = await anilistService.getAnimeById(anilistId);

      if (!media) {
        res.status(404).json({
          error: 'NotFound',
          message: `Anime with AniList ID ${anilistId} not found.`,
        });
        return;
      }

      res.status(200).json({ media });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AniList query error';
      res.status(500).json({
        error: 'AniListError',
        message,
      });
    }
  }

  /**
   * POST /api/v1/anilist/import
   * Imports an anime from AniList into Supabase catalog with 1-click
   */
  public async importAnime(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anilistId, autoCreateEpisodes = true } = req.body;

    if (!anilistId || typeof anilistId !== 'number') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'anilistId (number) is required in the request body.',
      });
      return;
    }

    try {
      // 1. Fetch from AniList GraphQL
      const media = await anilistService.getAnimeById(anilistId);

      if (!media) {
        res.status(404).json({
          error: 'NotFound',
          message: `Anime with AniList ID ${anilistId} was not found on AniList.`,
        });
        return;
      }

      // 2. Normalize schema
      const { anime: animeData, genres: rawGenres } = anilistService.formatForSupabase(media);

      // Check if anime already exists by anilist_id or slug
      const { data: existingAnime } = await supabaseAdmin
        .from('animes')
        .select('id, slug, name')
        .or(`anilist_id.eq.${anilistId},slug.eq.${animeData.slug}`)
        .maybeSingle();

      let animeId: number;

      if (existingAnime) {
        // Update existing anime
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('animes')
          .update({
            ...animeData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAnime.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update anime: ${updateError.message}`);
        }

        animeId = updated.id;
      } else {
        // Insert new anime
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('animes')
          .insert({
            ...animeData,
            claimed_by: req.user?.id || null,
            claimed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to insert anime: ${insertError.message}`);
        }

        animeId = inserted.id;
      }

      // 3. Associate Genres
      if (rawGenres.length > 0) {
        // Fetch all system genres
        const { data: systemGenres } = await supabaseAdmin.from('genres').select('id, name, slug');

        if (systemGenres) {
          for (const genreName of rawGenres) {
            const matchedGenre = systemGenres.find(
              (g) =>
                g.name.toLowerCase() === genreName.toLowerCase() ||
                g.slug.toLowerCase() === genreName.toLowerCase().replace(/\s+/g, '-')
            );

            if (matchedGenre) {
              await supabaseAdmin
                .from('anime_genres')
                .upsert(
                  { anime_id: animeId, genre_id: matchedGenre.id },
                  { onConflict: 'anime_id,genre_id' }
                );
            }
          }
        }
      }

      // 4. Auto-generate episode placeholders if requested and episodes > 0
      let createdEpisodesCount = 0;
      if (autoCreateEpisodes && animeData.episodes > 0) {
        const episodeInserts = [];
        for (let i = 1; i <= animeData.episodes; i++) {
          episodeInserts.push({
            anime_id: animeId,
            episode_number: i,
            title: `Episodio ${i}`,
            status: 'pending',
            views: 0,
            created_by: req.user?.id || null,
          });
        }

        const { error: epError, data: epData } = await supabaseAdmin
          .from('episodes')
          .upsert(episodeInserts, { onConflict: 'anime_id,episode_number' })
          .select('id');

        if (!epError && epData) {
          createdEpisodesCount = epData.length;
        }
      }

      // 5. Register in Audit Log
      if (req.user?.id) {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: req.user.id,
          action: 'import_anime_anilist',
          entity_type: 'animes',
          entity_id: String(animeId),
          details: {
            anilist_id: anilistId,
            name: animeData.name,
            episodes: animeData.episodes,
            created_episodes: createdEpisodesCount,
          },
        });
      }

      // Retrieve full resulting anime
      const { data: fullAnime } = await supabaseAdmin
        .from('animes')
        .select('*, anime_genres(genres(*))')
        .eq('id', animeId)
        .single();

      res.status(201).json({
        message: `Anime "${animeData.name}" imported successfully with ${createdEpisodesCount} episodes.`,
        anime: fullAnime,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown import error';
      res.status(500).json({
        error: 'ImportError',
        message: `Failed to import anime from AniList: ${message}`,
      });
    }
  }
}

export const anilistController = new AniListController();
