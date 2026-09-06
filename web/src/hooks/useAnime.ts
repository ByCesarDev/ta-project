import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { AnimeFilters, AnimeWithGenres, GenreRow } from '../types/index.js';

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as GenreRow[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useFeaturedAnimes() {
  return useQuery({
    queryKey: ['animes', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animes')
        .select(`
          *,
          anime_genres (
            genres (*)
          )
        `)
        .order('views_count', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((anime) => ({
        ...anime,
        genres: anime.anime_genres?.map((ag: { genres: GenreRow | null }) => ag.genres).filter(Boolean) as GenreRow[],
      })) as AnimeWithGenres[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecentEpisodes() {
  return useQuery({
    queryKey: ['episodes', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          id,
          episode_number,
          title,
          thumbnail,
          status,
          created_at,
          animes (
            id,
            name,
            slug,
            cover_image
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useAnimeCatalog(filters: AnimeFilters) {
  return useQuery({
    queryKey: ['animes', 'catalog', filters],
    queryFn: async () => {
      let query = supabase.from('animes').select(`
        *,
        anime_genres (
          genres (*)
        )
      `, { count: 'exact' });

      // Search query filter (title romaji, english or name)
      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`name.ilike.${term},title_english.ilike.${term},title_romaji.ilike.${term}`);
      }

      // Status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Format filter
      if (filters.format) {
        query = query.eq('format', filters.format);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'episodes':
          query = query.order('episodes', { ascending: false });
          break;
        case 'views':
        default:
          query = query.order('views_count', { ascending: false });
          break;
      }

      const { data, count, error } = await query;
      if (error) throw error;

      let formatted = (data || []).map((anime) => ({
        ...anime,
        genres: anime.anime_genres?.map((ag: { genres: GenreRow | null }) => ag.genres).filter(Boolean) as GenreRow[],
      })) as AnimeWithGenres[];

      // Filter by genre slug in-memory if requested (due to N:M relation)
      if (filters.genreSlug) {
        formatted = formatted.filter((a) =>
          a.genres?.some((g) => g.slug === filters.genreSlug)
        );
      }

      return {
        animes: formatted,
        totalCount: count ?? formatted.length,
      };
    },
  });
}

export function useAnimeDetails(slug: string) {
  return useQuery({
    queryKey: ['anime', 'details', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animes')
        .select(`
          *,
          anime_genres (
            genres (*)
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        genres: data.anime_genres?.map((ag: { genres: GenreRow | null }) => ag.genres).filter(Boolean) as GenreRow[],
      } as AnimeWithGenres;
    },
    enabled: Boolean(slug),
  });
}
