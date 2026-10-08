import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.js';
import { HistoryItem } from '../types/index.js';

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
              title_romaji,
              title_english,
              cover_image,
              series_entries (
                series_seasons (
                  id,
                  name,
                  season_number,
                  kind,
                  series (
                    id,
                    name,
                    slug
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => {
        const ep = item.episodes;
        const anime = ep?.animes;
        const entryObj = Array.isArray(anime?.series_entries) ? anime.series_entries[0] : anime?.series_entries;
        const season = entryObj?.series_seasons;
        const parentSeries = season?.series;
        const seriesSlug = parentSeries?.slug || anime?.slug;
        const seriesName = parentSeries?.name || anime?.name;
        const seasonName = season?.name;
        return {
          id: item.id,
          episode_id: item.episode_id,
          progress_seconds: item.progress_seconds,
          total_seconds: item.total_seconds,
          is_completed: item.is_completed,
          updated_at: item.updated_at,
          episode: {
            ...ep,
            season_name: seasonName,
            anime: {
              ...anime,
              series_slug: seriesSlug,
              series_name: seriesName,
            },
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

export function useToggleEpisodeWatched() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      episodeId,
      currentlyCompleted,
      duration = 1440,
    }: {
      episodeId: number;
      currentlyCompleted?: boolean;
      duration?: number;
    }) => {
      const willBeCompleted = !currentlyCompleted;
      const progressSeconds = willBeCompleted ? duration : 0;
      const totalSeconds = duration;

      // Local storage fallback
      try {
        localStorage.setItem(
          `ta_ep_progress_${episodeId}`,
          JSON.stringify({
            progress_seconds: progressSeconds,
            total_seconds: totalSeconds,
            is_completed: willBeCompleted,
            updated_at: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }

      if (!user) return { is_completed: willBeCompleted };

      if (willBeCompleted) {
        const { error } = await supabase
          .from('user_history')
          .upsert(
            {
              user_id: user.id,
              episode_id: episodeId,
              progress_seconds: progressSeconds,
              total_seconds: totalSeconds,
              is_completed: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,episode_id' }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('episode_id', episodeId);
        if (error) throw error;
      }

      return { is_completed: willBeCompleted };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['history', user?.id, 'episode', vars.episodeId] });
      queryClient.invalidateQueries({ queryKey: ['history', user?.id] });
    },
  });
}

export function useToggleSeasonWatched() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      episodeIds,
      markAsWatched,
      defaultDuration = 1440,
    }: {
      episodeIds: number[];
      markAsWatched: boolean;
      defaultDuration?: number;
    }) => {
      if (!episodeIds || episodeIds.length === 0) return;

      // Update localStorage
      episodeIds.forEach((id) => {
        try {
          if (markAsWatched) {
            localStorage.setItem(
              `ta_ep_progress_${id}`,
              JSON.stringify({
                progress_seconds: defaultDuration,
                total_seconds: defaultDuration,
                is_completed: true,
                updated_at: new Date().toISOString(),
              })
            );
          } else {
            localStorage.removeItem(`ta_ep_progress_${id}`);
          }
        } catch {
          // ignore
        }
      });

      if (!user) return;

      if (markAsWatched) {
        const rows = episodeIds.map((id) => ({
          user_id: user.id,
          episode_id: id,
          progress_seconds: defaultDuration,
          total_seconds: defaultDuration,
          is_completed: true,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('user_history')
          .upsert(rows, { onConflict: 'user_id,episode_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .in('episode_id', episodeIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', user?.id] });
    },
  });
}
