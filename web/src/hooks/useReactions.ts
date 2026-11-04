import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export interface ReactionStats {
  likes: number;
  dislikes: number;
  user_reaction: 'like' | 'dislike' | null;
}

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

export function useEpisodeReactions(episodeId: number) {
  return useQuery<ReactionStats>({
    queryKey: ['episode-reactions', episodeId],
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/reactions/episode/${episodeId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Error al obtener reacciones');
      }

      const data = await res.json();
      return {
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        user_reaction: data.user_reaction || null,
      };
    },
    enabled: Boolean(episodeId && episodeId > 0),
    staleTime: 1000 * 30,
  });
}

export function useSetEpisodeReaction(episodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reaction: 'like' | 'dislike') => {
      const token = await getAuthToken();
      if (!token) throw new Error('Debes iniciar sesión para reaccionar.');

      const res = await fetch(`${API_BASE}/reactions/episode/${episodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al guardar reacción');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['episode-reactions', episodeId], {
        likes: data.likes,
        dislikes: data.dislikes,
        user_reaction: data.user_reaction,
      });
    },
  });
}
