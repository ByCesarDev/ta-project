import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { EpisodeRow, EpisodeSourceRow } from '../types/index.js';

export function useAnimeEpisodes(animeId?: number) {
  return useQuery({
    queryKey: ['anime', animeId, 'episodes'],
    queryFn: async () => {
      if (!animeId) return [];

      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeId)
        .order('episode_number', { ascending: true });

      if (error) throw error;
      return (data || []) as EpisodeRow[];
    },
    enabled: Boolean(animeId),
  });
}

export function useEpisodeWithSources(animeSlug: string, episodeNumber: number) {
  return useQuery({
    queryKey: ['episode', animeSlug, episodeNumber],
    queryFn: async () => {
      // 1. Resolve anime
      const { data: anime, error: animeErr } = await supabase
        .from('animes')
        .select('id, name, slug, title_romaji, title_english, episodes')
        .eq('slug', animeSlug)
        .single();

      if (animeErr || !anime) throw new Error('Anime no encontrado');

      // 2. Resolve episode
      const { data: episode, error: epErr } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', anime.id)
        .eq('episode_number', episodeNumber)
        .single();

      if (epErr || !episode) throw new Error(`Episodio ${episodeNumber} no encontrado`);

      // 3. Resolve active sources (RLS enforces is_active = true)
      const { data: sources, error: srcErr } = await supabase
        .from('episode_sources')
        .select('*')
        .eq('episode_id', episode.id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (srcErr) throw srcErr;

      return {
        anime,
        episode: episode as EpisodeRow,
        sources: (sources || []) as EpisodeSourceRow[],
      };
    },
    enabled: Boolean(animeSlug && episodeNumber),
  });
}
