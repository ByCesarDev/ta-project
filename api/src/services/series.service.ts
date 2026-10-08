import { supabaseAdmin } from '../config/supabaseAdmin.js';
import {
  Series,
  SeriesSeason,
  SeriesEntry,
  SeasonKind,
  NormalizedAnimeInsert,
} from '../types/index.js';

export interface ListSeriesParams {
  page?: number;
  limit?: number;
  search?: string;
  genreSlug?: string;
  status?: string;
  format?: string;
  sortBy?: 'views' | 'recent' | 'name' | 'episodes';
}

export class SeriesService {
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
   * Lists series with aggregated genres, status and season count
   */
  public async listSeries(params: ListSeriesParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 24));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('series')
      .select(`
        *,
        series_seasons(
          id,
          name,
          season_number,
          kind,
          display_order,
          series_entries(
            id,
            display_order,
            part_label,
            anime:animes(
              id,
              name,
              status,
              format,
              episodes,
              cover_image,
              banner_image,
              anime_genres(
                genres(
                  id,
                  name,
                  slug
                )
              )
            )
          )
        )
      `, { count: 'exact' });

    // 1. Text Search Filter
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      query = query.ilike('name', `%${q}%`);
    }

    // 2. Status Filter
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    // 3. Sorting
    if (params.sortBy === 'name') {
      query = query.order('name', { ascending: true });
    } else if (params.sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('views_count', { ascending: false });
    }

    // 4. Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list series: ${error.message}`);
    }

    // Process and enrich series
    const enrichedSeries = (data || []).map((s: any) => {
      const seasons = (s.series_seasons || []).sort(
        (a: any, b: any) => a.display_order - b.display_order
      );

      // Aggregate genres across all seasons and entries
      const genreMap = new Map<number, { id: number; name: string; slug: string }>();
      let totalEpisodes = 0;

      seasons.forEach((season: any) => {
        (season.series_entries || []).forEach((entry: any) => {
          if (entry.anime) {
            const count = Array.isArray(entry.anime.episodes)
              ? entry.anime.episodes.length
              : typeof entry.anime.episodes === 'number'
              ? entry.anime.episodes
              : 0;
            totalEpisodes += count;
            if (Array.isArray(entry.anime.anime_genres)) {
              entry.anime.anime_genres.forEach((ag: any) => {
                if (ag.genres) {
                  genreMap.set(ag.genres.id, ag.genres);
                }
              });
            }
          }
        });
      });

      return {
        ...s,
        seasons,
        genres: Array.from(genreMap.values()),
        total_seasons_count: seasons.length,
        total_episodes_count: totalEpisodes,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      series: enrichedSeries,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves a series by slug with full season and episode hierarchy
   */
  public async getSeriesBySlug(slug: string): Promise<any> {
    const cleanSlug = slug.trim().toLowerCase();

    // 1. Direct query
    let { data: series, error } = await supabaseAdmin
      .from('series')
      .select(`
        *,
        series_seasons(
          id,
          series_id,
          season_number,
          name,
          kind,
          display_order,
          series_entries(
            id,
            season_id,
            anime_id,
            display_order,
            part_label,
            anime:animes(
              id,
              name,
              title_romaji,
              title_english,
              title_native,
              cover_image,
              banner_image,
              status,
              episodes,
              description,
              anilist_id,
              season_year,
              format,
              slug,
              views_count,
              air_day,
              air_time,
              air_timezone,
              anime_genres(
                genres(
                  id,
                  name,
                  slug
                )
              ),
              episodes_list:episodes(
                id,
                anime_id,
                episode_number,
                title,
                description,
                thumbnail,
                duration,
                status,
                views,
                episode_sources(
                  id,
                  provider,
                  server_name,
                  language,
                  audio_variant,
                  audio_language,
                  language_label,
                  quality,
                  is_active
                )
              )
            )
          )
        )
      `)
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch series: ${error.message}`);
    }

    let redirectedFrom: string | undefined;
    let targetSeasonId: number | undefined;

    // 2. Check alias redirects table if not found directly
    if (!series) {
      const { data: redirect } = await supabaseAdmin
        .from('series_slug_redirects')
        .select('*, series:series(*)')
        .eq('old_slug', cleanSlug)
        .maybeSingle();

      if (redirect && redirect.series) {
        redirectedFrom = cleanSlug;
        targetSeasonId = redirect.target_season_id || undefined;
        return this.getSeriesBySlug(redirect.series.slug);
      }

      // 3. Check if it's an individual anime slug (e.g. nanatsu-no-taizai)
      const { data: animeMatch } = await supabaseAdmin
        .from('animes')
        .select(`
          id,
          series_entries(
            season_id,
            series_seasons(
              series_id,
              series(
                slug
              )
            )
          )
        `)
        .eq('slug', cleanSlug)
        .maybeSingle();

      const entryObj = Array.isArray((animeMatch as any)?.series_entries) ? (animeMatch as any).series_entries[0] : (animeMatch as any)?.series_entries;
      const matchedSeriesSlug = entryObj?.series_seasons?.series?.slug;
      const matchedSeasonId = entryObj?.season_id;

      if (matchedSeriesSlug) {
        const found = await this.getSeriesBySlug(matchedSeriesSlug);
        if (found) {
          return {
            ...found,
            redirectedFrom: cleanSlug,
            targetSeasonId: matchedSeasonId,
          };
        }
      }

      return null;
    }

    // Sort seasons and entries
    const sortedSeasons = (series.series_seasons || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((season: any) => {
        let seasonEpisodes = 0;
        const sortedEntries = (season.series_entries || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((entry: any) => {
            if (entry.anime) {
              const epList = (entry.anime.episodes_list || (Array.isArray(entry.anime.episodes) ? entry.anime.episodes : [])).sort(
                (a: any, b: any) => Number(a.episode_number) - Number(b.episode_number)
              );
              const rawCount = typeof entry.anime.episodes === 'number' && entry.anime.episodes > 0
                ? entry.anime.episodes
                : epList.length;
              entry.anime.episodes = epList;
              entry.anime.episodes_count = rawCount;
              seasonEpisodes += rawCount;
            }
            return entry;
          });

        return {
          ...season,
          series_entries: sortedEntries,
          total_episodes_count: seasonEpisodes,
        };
      });

    // Aggregate genres and totals
    const genreMap = new Map<number, { id: number; name: string; slug: string }>();
    let totalEpisodes = 0;

    sortedSeasons.forEach((season: any) => {
      totalEpisodes += (season.total_episodes_count || 0);
      (season.series_entries || []).forEach((entry: any) => {
        if (entry.anime && Array.isArray(entry.anime.anime_genres)) {
          entry.anime.anime_genres.forEach((ag: any) => {
            if (ag.genres) genreMap.set(ag.genres.id, ag.genres);
          });
        }
      });
    });

    return {
      ...series,
      seasons: sortedSeasons,
      genres: Array.from(genreMap.values()),
      total_seasons_count: sortedSeasons.length,
      total_episodes_count: totalEpisodes,
      redirectedFrom,
      targetSeasonId,
    };
  }

  /**
   * Creates a new Series
   */
  public async createSeries(data: {
    name: string;
    slug?: string;
    description?: string;
    cover_image?: string;
    banner_image?: string;
    status?: string;
  }, userId?: string): Promise<Series> {
    const slug = data.slug ? this.generateSlug(data.slug) : this.generateSlug(data.name);

    const { data: created, error } = await supabaseAdmin
      .from('series')
      .insert({
        name: data.name,
        slug,
        description: data.description || null,
        cover_image: data.cover_image || null,
        banner_image: data.banner_image || null,
        status: data.status || 'finalizado',
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create series: ${error.message}`);
    }

    return created as Series;
  }

  /**
   * Updates an existing Series
   */
  public async updateSeries(
    id: number,
    data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      cover_image: string | null;
      banner_image: string | null;
      status: string;
    }>
  ): Promise<Series> {
    // If slug changed, preserve old slug redirect
    if (data.slug) {
      const { data: current } = await supabaseAdmin
        .from('series')
        .select('slug')
        .eq('id', id)
        .single();

      if (current && current.slug !== data.slug) {
        await supabaseAdmin
          .from('series_slug_redirects')
          .upsert({
            old_slug: current.slug,
            target_series_id: id,
          });
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('series')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update series: ${error.message}`);
    }

    return updated as Series;
  }

  /**
   * Deletes a series with strict ON DELETE RESTRICT enforcement
   */
  public async deleteSeries(id: number): Promise<boolean> {
    const { count } = await supabaseAdmin
      .from('series_seasons')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', id);

    if (count && count > 0) {
      throw new Error('No se puede eliminar la serie porque aún contiene temporadas vinculadas.');
    }

    const { error } = await supabaseAdmin.from('series').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete series: ${error.message}`);
    }

    return true;
  }

  /**
   * Creates a season within a series
   */
  public async createSeason(
    seriesId: number,
    data: {
      name: string;
      season_number?: number;
      kind?: SeasonKind;
      display_order?: number;
    }
  ): Promise<SeriesSeason> {
    let displayOrder = data.display_order;
    if (!displayOrder) {
      const { data: existing } = await supabaseAdmin
        .from('series_seasons')
        .select('display_order')
        .eq('series_id', seriesId)
        .order('display_order', { ascending: false })
        .limit(1);

      displayOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;
    }

    const { data: created, error } = await supabaseAdmin
      .from('series_seasons')
      .insert({
        series_id: seriesId,
        season_number: data.season_number || null,
        name: data.name,
        kind: data.kind || 'season',
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create season: ${error.message}`);
    }

    return created as SeriesSeason;
  }

  /**
   * Updates a season
   */
  public async updateSeason(
    seasonId: number,
    data: Partial<{
      name: string;
      season_number: number | null;
      kind: SeasonKind;
      display_order: number;
    }>
  ): Promise<SeriesSeason> {
    const { data: updated, error } = await supabaseAdmin
      .from('series_seasons')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seasonId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update season: ${error.message}`);
    }

    return updated as SeriesSeason;
  }

  /**
   * Deletes a season (with optional cascade deletion of linked entries)
   */
  public async deleteSeason(seasonId: number, cascadeEntries: boolean = true): Promise<boolean> {
    if (cascadeEntries) {
      // Remove linked entries from this season first
      const { error: entryDelErr } = await supabaseAdmin
        .from('series_entries')
        .delete()
        .eq('season_id', seasonId);

      if (entryDelErr) {
        throw new Error(`Failed to remove season entries: ${entryDelErr.message}`);
      }
    } else {
      const { count } = await supabaseAdmin
        .from('series_entries')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', seasonId);

      if (count && count > 0) {
        throw new Error('No se puede eliminar la temporada porque aún tiene entregas vinculadas.');
      }
    }

    const { error } = await supabaseAdmin.from('series_seasons').delete().eq('id', seasonId);
    if (error) {
      throw new Error(`Failed to delete season: ${error.message}`);
    }

    return true;
  }

  /**
   * Deletes an individual entry binding
   */
  public async deleteEntry(entryId: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('series_entries').delete().eq('id', entryId);
    if (error) {
      throw new Error(`Failed to delete entry: ${error.message}`);
    }
    return true;
  }

  /**
   * Links an anime entry to a season
   */
  public async createEntry(
    seasonId: number,
    data: {
      anime_id: number;
      display_order?: number;
      part_label?: string;
    }
  ): Promise<SeriesEntry> {
    let displayOrder = data.display_order;
    if (!displayOrder) {
      const { data: existing } = await supabaseAdmin
        .from('series_entries')
        .select('display_order')
        .eq('season_id', seasonId)
        .order('display_order', { ascending: false })
        .limit(1);

      displayOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;
    }

    const { data: created, error } = await supabaseAdmin
      .from('series_entries')
      .insert({
        season_id: seasonId,
        anime_id: data.anime_id,
        display_order: displayOrder,
        part_label: data.part_label || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link entry: ${error.message}`);
    }

    return created as SeriesEntry;
  }

  /**
   * Reassigns an entry to a different season (anti-orphan enforcement)
   */
  public async reassignEntry(
    entryId: number,
    targetSeasonId: number,
    partLabel?: string,
    displayOrder?: number
  ): Promise<SeriesEntry> {
    const { data: updated, error } = await supabaseAdmin
      .from('series_entries')
      .update({
        season_id: targetSeasonId,
        part_label: partLabel !== undefined ? partLabel : undefined,
        display_order: displayOrder !== undefined ? displayOrder : undefined,
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reassign entry: ${error.message}`);
    }

    return updated as SeriesEntry;
  }

  /**
   * Promotes an entry into an independent Series
   */
  public async promoteEntryToSeries(
    entryId: number,
    newSeriesData: {
      name: string;
      slug?: string;
      description?: string;
      cover_image?: string;
      banner_image?: string;
    },
    userId?: string
  ) {
    const newSeries = await this.createSeries(newSeriesData, userId);
    const newSeason = await this.createSeason(newSeries.id, {
      name: 'Temporada 1',
      season_number: 1,
      kind: 'season',
      display_order: 1,
    });

    const updatedEntry = await this.reassignEntry(entryId, newSeason.id);
    return {
      series: newSeries,
      season: newSeason,
      entry: updatedEntry,
    };
  }

  /**
   * Imports an AniList entry transactionally, creating or binding to series and season together
   */
  public async importAniListEntryTransactional(params: {
    seriesOption: 'new' | 'existing';
    seriesId?: number;
    newSeriesData?: {
      name: string;
      slug?: string;
      description?: string;
      cover_image?: string;
      banner_image?: string;
    };
    seasonOption: 'new' | 'existing';
    seasonId?: number;
    newSeasonData?: {
      name: string;
      season_number?: number;
      kind?: SeasonKind;
    };
    animeData: NormalizedAnimeInsert;
    partLabel?: string;
    userId?: string;
  }) {
    // 1. Resolve or Create Series
    let targetSeriesId = params.seriesId;
    let targetSeries: Series;

    if (params.seriesOption === 'new') {
      if (!params.newSeriesData || !params.newSeriesData.name) {
        throw new Error('Datos de nueva serie requeridos');
      }
      targetSeries = await this.createSeries(params.newSeriesData, params.userId);
      targetSeriesId = targetSeries.id;
    } else {
      if (!targetSeriesId) throw new Error('ID de serie requerida');
      const { data: found, error } = await supabaseAdmin
        .from('series')
        .select('*')
        .eq('id', targetSeriesId)
        .single();

      if (error || !found) throw new Error('Serie de destino no encontrada');
      targetSeries = found as Series;
    }

    // 2. Resolve or Create Season
    let targetSeasonId = params.seasonId;
    let targetSeason: SeriesSeason;

    if (params.seasonOption === 'new') {
      if (!params.newSeasonData || !params.newSeasonData.name) {
        throw new Error('Datos de nueva temporada requeridos');
      }
      targetSeason = await this.createSeason(targetSeriesId, {
        name: params.newSeasonData.name,
        season_number: params.newSeasonData.season_number,
        kind: params.newSeasonData.kind || 'season',
      });
      targetSeasonId = targetSeason.id;
    } else {
      if (!targetSeasonId) throw new Error('ID de temporada requerida');
      const { data: foundSeason, error: seasonErr } = await supabaseAdmin
        .from('series_seasons')
        .select('*')
        .eq('id', targetSeasonId)
        .single();

      if (seasonErr || !foundSeason) throw new Error('Temporada de destino no encontrada');
      targetSeason = foundSeason as SeriesSeason;
    }

    // 3. Upsert / Create Anime record
    let animeId: number;
    if (params.animeData.anilist_id) {
      const { data: existingAnime } = await supabaseAdmin
        .from('animes')
        .select('id')
        .eq('anilist_id', params.animeData.anilist_id)
        .maybeSingle();

      if (existingAnime) {
        animeId = existingAnime.id;
      } else {
        const { data: insertedAnime, error: insErr } = await supabaseAdmin
          .from('animes')
          .insert(params.animeData)
          .select('id')
          .single();

        if (insErr) throw new Error(`Failed to insert anime: ${insErr.message}`);
        animeId = insertedAnime.id;
      }
    } else {
      const { data: insertedAnime, error: insErr } = await supabaseAdmin
        .from('animes')
        .insert(params.animeData)
        .select('id')
        .single();

      if (insErr) throw new Error(`Failed to insert anime: ${insErr.message}`);
      animeId = insertedAnime.id;
    }

    // 4. Create Entry binding
    const entry = await this.createEntry(targetSeasonId, {
      anime_id: animeId,
      part_label: params.partLabel,
    });

    return {
      series: targetSeries,
      season: targetSeason,
      anime_id: animeId,
      entry,
    };
  }

  /**
   * Combines two series atomically, migrating seasons, favorites and alias redirects
   */
  public async combineSeries(sourceSeriesId: number, targetSeriesId: number) {
    if (sourceSeriesId === targetSeriesId) {
      throw new Error('No se puede combinar una serie con ella misma');
    }

    // 1. Verify both series exist
    const { data: sourceSeries, error: srcErr } = await supabaseAdmin
      .from('series')
      .select('*')
      .eq('id', sourceSeriesId)
      .single();

    const { data: targetSeries, error: tgtErr } = await supabaseAdmin
      .from('series')
      .select('*')
      .eq('id', targetSeriesId)
      .single();

    if (srcErr || !sourceSeries || tgtErr || !targetSeries) {
      throw new Error('Una de las series a combinar no existe');
    }

    // 2. Get highest display_order in target series
    const { data: targetSeasons } = await supabaseAdmin
      .from('series_seasons')
      .select('display_order')
      .eq('series_id', targetSeriesId)
      .order('display_order', { ascending: false })
      .limit(1);

    const baseOrder = targetSeasons && targetSeasons.length > 0 ? targetSeasons[0].display_order : 0;

    // 3. Move all seasons from source to target with offset order
    const { data: sourceSeasons } = await supabaseAdmin
      .from('series_seasons')
      .select('id, display_order')
      .eq('series_id', sourceSeriesId);

    if (sourceSeasons && sourceSeasons.length > 0) {
      for (let i = 0; i < sourceSeasons.length; i++) {
        await supabaseAdmin
          .from('series_seasons')
          .update({
            series_id: targetSeriesId,
            display_order: baseOrder + i + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sourceSeasons[i].id);
      }
    }

    // 4. Register slug redirect for sourceSeries.slug -> targetSeriesId
    await supabaseAdmin
      .from('series_slug_redirects')
      .upsert({
        old_slug: sourceSeries.slug,
        target_series_id: targetSeriesId,
      });

    // 5. Migrate user_favorites (deduplicated)
    const { data: sourceFavorites } = await supabaseAdmin
      .from('user_favorites')
      .select('user_id')
      .eq('series_id', sourceSeriesId);

    if (sourceFavorites && sourceFavorites.length > 0) {
      for (const fav of sourceFavorites) {
        await supabaseAdmin
          .from('user_favorites')
          .upsert({
            user_id: fav.user_id,
            series_id: targetSeriesId,
          }, { onConflict: 'user_id,series_id' });
      }
    }

    // 6. Delete source series
    const { error: delErr } = await supabaseAdmin
      .from('series')
      .delete()
      .eq('id', sourceSeriesId);

    if (delErr) {
      throw new Error(`Failed to remove merged source series: ${delErr.message}`);
    }

    return {
      success: true,
      targetSeriesId,
      migratedSeasonsCount: sourceSeasons?.length || 0,
    };
  }
}

export const seriesService = new SeriesService();
