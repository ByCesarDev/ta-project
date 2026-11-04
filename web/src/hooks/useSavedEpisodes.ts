import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

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

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

/**
 * Fetch all saved episodes of current user
 */
export function useSavedEpisodes() {
  return useQuery<SavedEpisodeItem[]>({
    queryKey: ['saved-episodes'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return [];

      const res = await fetch(`${API_BASE}/saved-episodes`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al cargar episodios guardados');
      }

      const data = await res.json();
      return data.episodes || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Check if a specific episode is saved
 */
export function useIsEpisodeSaved(episodeId?: number) {
  return useQuery<boolean>({
    queryKey: ['saved-episodes', 'check', episodeId],
    queryFn: async () => {
      if (!episodeId) return false;
      const token = await getAuthToken();
      if (!token) {
        // Fallback to local storage for guests
        return localStorage.getItem(`ta_saved_ep_${episodeId}`) === 'true';
      }

      const res = await fetch(`${API_BASE}/saved-episodes/${episodeId}/check`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.is_saved);
    },
    enabled: Boolean(episodeId && episodeId > 0),
    staleTime: 1000 * 30,
  });
}

/**
 * Toggle saved status of an episode
 */
export function useToggleSavedEpisode(episodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metadata: {
      animeId?: number;
      seriesId?: number;
      animeSlug: string;
      animeTitle: string;
      episodeNumber: number;
      episodeTitle?: string | null;
      thumbnail?: string | null;
      duration?: string | null;
    }) => {
      const token = await getAuthToken();
      if (!token) {
        // Local fallback for guests
        const key = `ta_saved_ep_${episodeId}`;
        const current = localStorage.getItem(key) === 'true';
        localStorage.setItem(key, String(!current));
        return { is_saved: !current };
      }

      const res = await fetch(`${API_BASE}/saved-episodes/${episodeId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(metadata),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al guardar episodio');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['saved-episodes', 'check', episodeId], data.is_saved);
      queryClient.invalidateQueries({ queryKey: ['saved-episodes'] });
    },
  });
}

/**
 * Remove an episode from saved list
 */
export function useRemoveSavedEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (episodeId: number) => {
      const token = await getAuthToken();
      if (!token) {
        localStorage.removeItem(`ta_saved_ep_${episodeId}`);
        return;
      }

      const res = await fetch(`${API_BASE}/saved-episodes/${episodeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al eliminar');
      }
    },
    onSuccess: (_data, episodeId) => {
      queryClient.setQueryData(['saved-episodes', 'check', episodeId], false);
      queryClient.invalidateQueries({ queryKey: ['saved-episodes'] });
    },
  });
}
