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
      if (!episodeId) return null;

      // 1. Try fetching from Supabase if authenticated
      if (user) {
        const { data, error } = await supabase
          .from('user_history')
          .select('progress_seconds, total_seconds, is_completed')
          .eq('user_id', user.id)
          .eq('episode_id', episodeId)
          .maybeSingle();

        if (!error && data) return data;
      }

      // 2. Fallback to localStorage for guest or instant local resume
      try {
        const cached = localStorage.getItem(`ta_ep_progress_${episodeId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.progress_seconds === 'number') {
            return {
              progress_seconds: parsed.progress_seconds,
              total_seconds: parsed.total_seconds || 0,
              is_completed: Boolean(parsed.is_completed),
            };
          }
        }
      } catch {
        // Ignore JSON/storage errors
      }

      return null;
    },
    enabled: Boolean(episodeId),
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
      const isCompleted = totalSeconds > 0 && progressSeconds / totalSeconds >= 0.90;
      const progressFloored = Math.floor(progressSeconds);
      const totalFloored = Math.floor(totalSeconds);

      // Always save to localStorage for zero-latency local recovery
      try {
        localStorage.setItem(
          `ta_ep_progress_${episodeId}`,
          JSON.stringify({
            progress_seconds: progressFloored,
            total_seconds: totalFloored,
            is_completed: isCompleted,
            updated_at: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore localStorage quota error
      }

      if (!user) return null; // Guest viewing, local storage is enough

      const { data, error } = await supabase
        .from('user_history')
        .upsert(
          {
            user_id: user.id,
            episode_id: episodeId,
            progress_seconds: progressFloored,
            total_seconds: totalFloored,
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
