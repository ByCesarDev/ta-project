import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import {
  SeriesWithSeasons,
  SeriesFilters,
  EpisodeRow,
  EpisodeSourceRow,
  GenreRow,
} from '../types/index.js';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

export function useSeriesCatalog(filters: SeriesFilters = {}) {
  return useQuery({
    queryKey: ['series', 'catalog', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.genreSlug) params.set('genreSlug', filters.genreSlug);
        if (filters.status && filters.status !== 'all') params.set('status', filters.status);
        if (filters.format) params.set('format', filters.format);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const res = await fetch(`${API_BASE_URL}/series?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return {
            series: (data.series || []) as SeriesWithSeasons[],
            total: data.total || 0,
            totalPages: data.totalPages || 1,
          };
        }
      } catch {
        // Fallback to direct Supabase query
      }

      // Supabase Fallback
      let query = supabase
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

      if (filters.search?.trim()) {
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.sortBy === 'name') {
        query = query.order('name', { ascending: true });
      } else if (filters.sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('views_count', { ascending: false });
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((s: any) => {
        const seasons = (s.series_seasons || []).sort(
          (a: any, b: any) => a.display_order - b.display_order
        );
        const genreMap = new Map<number, GenreRow>();
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
                  if (ag.genres) genreMap.set(ag.genres.id, ag.genres);
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
      }) as SeriesWithSeasons[];

      return {
        series: formatted,
        total: count ?? formatted.length,
        totalPages: Math.ceil((count ?? formatted.length) / (filters.limit || 24)),
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useFeaturedSeries() {
  return useQuery({
    queryKey: ['series', 'featured'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/series?limit=5&sortBy=views`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.series) && data.series.length > 0) {
            return data.series as SeriesWithSeasons[];
          }
        }
      } catch {
        // Fallback to direct Supabase query
      }

      // Supabase Fallback for Featured Series
      const { data, error } = await supabase
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
        `)
        .order('views_count', { ascending: false })
        .limit(5);

      if (error) return [];

      return (data || []).map((s: any) => {
        const seasons = (s.series_seasons || []).sort(
          (a: any, b: any) => a.display_order - b.display_order
        );
        const genreMap = new Map<number, GenreRow>();
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
                  if (ag.genres) genreMap.set(ag.genres.id, ag.genres);
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
      }) as SeriesWithSeasons[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSeriesDetail(slug: string) {
  return useQuery({
    queryKey: ['series', 'detail', slug],
    queryFn: async () => {
      if (!slug) return null;

      try {
        const res = await fetch(`${API_BASE_URL}/series/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          return data as SeriesWithSeasons;
        }
      } catch {
        // Fallback to Supabase
      }

      // Supabase direct query
      const { data } = await supabase
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
        .eq('slug', slug)
        .maybeSingle();

      let targetData = data;

      // If not found directly, check if it's an anime entry slug
      if (!targetData) {
        const { data: animeMatch } = await supabase
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
          .eq('slug', slug)
          .maybeSingle();

        const entryObj = Array.isArray((animeMatch as any)?.series_entries) ? (animeMatch as any).series_entries[0] : (animeMatch as any)?.series_entries;
        const parentSlug = entryObj?.series_seasons?.series?.slug;
        if (parentSlug) {
          const { data: matchedSeries } = await supabase
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
            .eq('slug', parentSlug)
            .maybeSingle();
          targetData = matchedSeries;
        }
      }

      if (!targetData) return null;

      // Sort seasons and entries
      let totalEpisodes = 0;
      const sortedSeasons = (targetData.series_seasons || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((season: any) => {
          let seasonEpCount = 0;
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
                seasonEpCount += rawCount;
              }
              return entry;
            });

          totalEpisodes += seasonEpCount;

          return {
            ...season,
            series_entries: sortedEntries,
            total_episodes_count: seasonEpCount,
          };
        });

      return {
        ...data,
        seasons: sortedSeasons,
        total_episodes_count: totalEpisodes,
      } as SeriesWithSeasons;
    },
    enabled: Boolean(slug),
  });
}

export function useWatchEpisode(seriesSlug: string, episodeIdOrNumber: string | number) {
  return useQuery({
    queryKey: ['watch', seriesSlug, episodeIdOrNumber],
    queryFn: async () => {
      // 1. Fetch full series hierarchy
      let seriesRes: SeriesWithSeasons | null = null;
      try {
        const res = await fetch(`${API_BASE_URL}/series/${encodeURIComponent(seriesSlug)}`);
        if (res.ok) {
          seriesRes = await res.json();
        }
      } catch {
        // ignore
      }

      // Supabase fallback if API fetch fails or returned 404
      if (!seriesRes) {
        let cleanSlug = seriesSlug.trim().toLowerCase();
        let { data: directSeries } = await supabase
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
                  cover_image,
                  banner_image,
                  status,
                  episodes,
                  slug,
                  episodes_list:episodes(
                    id,
                    anime_id,
                    episode_number,
                    title,
                    thumbnail,
                    duration,
                    status
                  )
                )
              )
            )
          `)
          .eq('slug', cleanSlug)
          .maybeSingle();

        // If not found, check if it's an anime entry slug
        if (!directSeries) {
          const { data: animeMatch } = await supabase
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
          const parentSlug = entryObj?.series_seasons?.series?.slug;
          if (parentSlug) {
            const { data: matchedSeries } = await supabase
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
                      cover_image,
                      banner_image,
                      status,
                      episodes,
                      slug,
                      episodes_list:episodes(
                        id,
                        anime_id,
                        episode_number,
                        title,
                        thumbnail,
                        duration,
                        status
                      )
                    )
                  )
                )
              `)
              .eq('slug', parentSlug)
              .maybeSingle();
            directSeries = matchedSeries;
          }
        }

        if (directSeries) {
          let totalEpisodes = 0;
          const sortedSeasons = (directSeries.series_seasons || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((season: any) => {
              let seasonEpCount = 0;
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
                    seasonEpCount += rawCount;
                  }
                  return entry;
                });
              totalEpisodes += seasonEpCount;
              return {
                ...season,
                series_entries: sortedEntries,
                total_episodes_count: seasonEpCount,
              };
            });

          seriesRes = {
            ...directSeries,
            seasons: sortedSeasons,
            total_episodes_count: totalEpisodes,
          } as SeriesWithSeasons;
        }
      }

      if (!seriesRes) {
        throw new Error('Serie no encontrada');
      }

      // 2. Find target episode across all seasons and entries
      let foundEpisode: any = null;
      let foundSeason: any = null;
      let foundAnime: any = null;
      let allFlatEpisodes: Array<{ episode: any; season: any; anime: any }> = [];

      const targetId = Number(episodeIdOrNumber);

      for (const season of seriesRes.seasons || []) {
        for (const entry of season.series_entries || []) {
          const anime = entry.anime;
          if (anime && Array.isArray(anime.episodes)) {
            for (const ep of anime.episodes) {
              const epItem = { episode: ep, season, anime };
              allFlatEpisodes.push(epItem);

              if (ep.id === targetId || ep.episode_number === targetId) {
                foundEpisode = ep;
                foundSeason = season;
                foundAnime = anime;
              }
            }
          }
        }
      }

      // If not found by ID directly, default to first episode
      if (!foundEpisode && allFlatEpisodes.length > 0) {
        foundEpisode = allFlatEpisodes[0].episode;
        foundSeason = allFlatEpisodes[0].season;
        foundAnime = allFlatEpisodes[0].anime;
      }

      if (!foundEpisode) {
        throw new Error('Episodio no encontrado');
      }

      // 3. Fetch active episode sources
      const { data: sources, error: srcErr } = await supabase
        .from('episode_sources')
        .select('*')
        .eq('episode_id', foundEpisode.id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (srcErr) throw srcErr;

      return {
        series: seriesRes,
        season: foundSeason,
        anime: foundAnime,
        episode: foundEpisode as EpisodeRow,
        sources: (sources || []) as EpisodeSourceRow[],
        allEpisodes: allFlatEpisodes,
      };
    },
    enabled: Boolean(seriesSlug && episodeIdOrNumber),
  });
}
