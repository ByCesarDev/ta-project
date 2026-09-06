import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.js';
import { HistoryItem, AnimeRow, EpisodeRow } from '../types/index.js';

export function useWatchHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_history')
        .select(`
          id,
          episode_id,
          progress_seconds,
          total_seconds,
          is_completed,
          updated_at,
          episodes (
            id,
            episode_number,
            title,
            thumbnail,
            duration,
            animes (
              id,
              name,
              slug,
              cover_image
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => {
        const ep = item.episodes as unknown as EpisodeRow & { animes: AnimeRow };
        return {
          id: item.id,
          episode_id: item.episode_id,
          progress_seconds: item.progress_seconds,
          total_seconds: item.total_seconds,
          is_completed: item.is_completed,
          updated_at: item.updated_at,
          episode: {
            ...ep,
            anime: ep?.animes,
          },
        } as unknown as HistoryItem;
      });
    },
    enabled: Boolean(user),
  });
}

export function useEpisodeProgress(episodeId?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['history', user?.id, 'episode', episodeId],
    queryFn: async () => {
      if (!user || !episodeId) return null;

      const { data, error } = await supabase
        .from('user_history')
        .select('progress_seconds, total_seconds, is_completed')
        .eq('user_id', user.id)
        .eq('episode_id', episodeId)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: Boolean(user && episodeId),
  });
}

export function useSaveProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      episodeId,
      progressSeconds,
      totalSeconds,
    }: {
      episodeId: number;
      progressSeconds: number;
      totalSeconds: number;
    }) => {
      if (!user) return null; // Guest viewing, skip persistence

      const isCompleted = totalSeconds > 0 && progressSeconds / totalSeconds >= 0.85;

      const { data, error } = await supabase
        .from('user_history')
        .upsert(
          {
            user_id: user.id,
            episode_id: episodeId,
            progress_seconds: Math.floor(progressSeconds),
            total_seconds: Math.floor(totalSeconds),
            is_completed: isCompleted,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,episode_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['history', user?.id, 'episode', vars.episodeId] });
      queryClient.invalidateQueries({ queryKey: ['history', user?.id] });
    },
  });
}
