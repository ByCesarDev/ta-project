import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface ListAnimesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  format?: string;
  sortBy?: 'views' | 'recent' | 'name' | 'episodes' | 'id';
}

export interface ListAnimesResult {
  animes: any[];
  total: number;
  page: number;
  limit: number;
}

export class AnimeService {
  /**
   * Helper to generate a clean URL slug
   */
  public generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Lists animes with genres, episode counts, parent series info, and filters
   */
  public async listAnimes(params: ListAnimesParams = {}): Promise<ListAnimesResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('animes')
      .select(`
        *,
        anime_genres(
          genres(
            id,
            name,
            slug
          )
        ),
        episodes_list:episodes(id),
        series_entries(
          series_seasons(
            series(
              id,
              name,
              slug
            )
          )
        )
      `, { count: 'exact' });

    // 1. Search Query Filter
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const num = Number(q);
      if (!isNaN(num) && Number.isInteger(num)) {
        query = query.or(`id.eq.${num},anilist_id.eq.${num},name.ilike.%${q}%,slug.ilike.%${q}%,title_english.ilike.%${q}%,title_romaji.ilike.%${q}%`);
      } else {
        query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,title_english.ilike.%${q}%,title_romaji.ilike.%${q}%`);
      }
    }

    // 2. Status Filter
    if (params.status && params.status !== 'all') {
      const s = params.status.toLowerCase();
      if (s === 'emision') {
        query = query.in('status', ['emision', 'RELEASING']);
      } else if (s === 'finalizado') {
        query = query.in('status', ['finalizado', 'FINISHED']);
      } else if (s === 'proximamente') {
        query = query.in('status', ['proximamente', 'NOT_YET_RELEASED']);
      } else {
        query = query.eq('status', params.status);
      }
    }

    // 3. Format Filter
    if (params.format && params.format !== 'all') {
      query = query.eq('format', params.format);
    }

    // 4. Sorting
    switch (params.sortBy) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'episodes':
        query = query.order('episodes', { ascending: false });
        break;
      case 'views':
        query = query.order('views_count', { ascending: false });
        break;
      case 'id':
      default:
        query = query.order('id', { ascending: false });
        break;
    }

    // 5. Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list animes: ${error.message}`);
    }

    const animes = (data || []).map((anime: any) => {
      const dbEpisodesCount = Array.isArray(anime.episodes_list) ? anime.episodes_list.length : 0;
      const declaredEpisodes = typeof anime.episodes === 'number' ? anime.episodes : 0;

      // Extract parent series info if bound
      let parentSeries = null;
      if (Array.isArray(anime.series_entries) && anime.series_entries.length > 0) {
        const firstEntry = anime.series_entries[0];
        if (firstEntry?.series_seasons?.series) {
          parentSeries = firstEntry.series_seasons.series;
        }
      } else if (anime.series_entries?.series_seasons?.series) {
        parentSeries = anime.series_entries.series_seasons.series;
      }

      return {
        ...anime,
        episodes: declaredEpisodes || dbEpisodesCount,
        db_episodes_count: dbEpisodesCount,
        total_episodes_count: dbEpisodesCount || declaredEpisodes,
        genres: (anime.anime_genres || []).map((ag: any) => ag.genres).filter(Boolean),
        parent_series: parentSeries,
      };
    });

    return {
      animes,
      total: count || animes.length,
      page,
      limit,
    };
  }

  /**
   * Retrieves single anime by ID or slug with sources, genres, episodes, and bindings
   */
  public async getAnimeByIdOrSlug(idOrSlug: string | number): Promise<any | null> {
    const isId = typeof idOrSlug === 'number' || (!isNaN(Number(idOrSlug)) && Number.isInteger(Number(idOrSlug)));

    let query = supabaseAdmin
      .from('animes')
      .select(`
        *,
        anime_genres(
          genres(
            id,
            name,
            slug
          )
        ),
        episodes_list:episodes(id, episode_number, title, thumbnail, status),
        anime_source_bindings(*),
        series_entries(
          series_seasons(
            series(
              id,
              name,
              slug
            )
          )
        )
      `);

    if (isId) {
      query = query.eq('id', Number(idOrSlug));
    } else {
      query = query.eq('slug', String(idOrSlug).trim());
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to get anime details: ${error.message}`);
    }

    if (!data) return null;

    const dbEpisodesCount = Array.isArray(data.episodes_list) ? data.episodes_list.length : 0;
    const declaredEpisodes = typeof data.episodes === 'number' ? data.episodes : 0;

    let parentSeries = null;
    if (Array.isArray(data.series_entries) && data.series_entries.length > 0) {
      const firstEntry = data.series_entries[0];
      if (firstEntry?.series_seasons?.series) {
        parentSeries = firstEntry.series_seasons.series;
      }
    } else if (data.series_entries?.series_seasons?.series) {
      parentSeries = data.series_entries.series_seasons.series;
    }

    return {
      ...data,
      episodes: declaredEpisodes || dbEpisodesCount,
      db_episodes_count: dbEpisodesCount,
      total_episodes_count: dbEpisodesCount || declaredEpisodes,
      genres: (data.anime_genres || []).map((ag: any) => ag.genres).filter(Boolean),
      parent_series: parentSeries,
    };
  }

  /**
   * Creates a new anime row in PostgreSQL
   */
  public async createAnime(payload: any, claimedBy?: string): Promise<any> {
    if (!payload.name || !payload.name.trim()) {
      throw new Error('El nombre del anime es obligatorio.');
    }

    const slug = payload.slug?.trim() || this.generateSlug(payload.name);

    const insertData: any = {
      name: payload.name.trim(),
      title_romaji: payload.title_romaji?.trim() || null,
      title_english: payload.title_english?.trim() || null,
      title_native: payload.title_native?.trim() || null,
      slug,
      status: payload.status || 'emision',
      episodes: typeof payload.episodes === 'number' ? payload.episodes : 0,
      format: payload.format || 'TV',
      season_year: payload.season_year || null,
      cover_image: payload.cover_image || 'https://totalanime.com/placeholder-cover.webp',
      banner_image: payload.banner_image || null,
      description: payload.description || '',
      anilist_id: payload.anilist_id || null,
      claimed_by: claimedBy || null,
      claimed_at: claimedBy ? new Date().toISOString() : null,
      views_count: 0,
    };

    const { data, error } = await supabaseAdmin
      .from('animes')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error al crear anime: ${error.message}`);
    }

    return data;
  }

  /**
   * Updates existing anime row
   */
  public async updateAnime(id: number, payload: any): Promise<any> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabaseAdmin
      .from('animes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error al actualizar anime: ${error.message}`);
    }

    return data;
  }

  /**
   * Deletes anime row
   */
  public async deleteAnime(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('animes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar anime: ${error.message}`);
    }
  }
}

export const animeService = new AnimeService();
