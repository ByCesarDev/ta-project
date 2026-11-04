import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export interface CommentItem {
  id: string;
  episode_id: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  user_role: string;
  content: string;
  is_spoiler: boolean;
  is_deleted: boolean;
  parent_id: string | null;
  likes_count: number;
  is_liked_by_me?: boolean;
  created_at: string;
  updated_at: string;
  replies?: CommentItem[];
}

interface CommentsResponse {
  success: boolean;
  comments: CommentItem[];
  total_count: number;
}

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

/**
 * Fetch all comments and replies for an episode
 */
export function useEpisodeComments(episodeId: number) {
  return useQuery<CommentsResponse>({
    queryKey: ['episode-comments', episodeId],
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/comments/episode/${episodeId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Error al cargar comentarios');
      }

      return res.json();
    },
    enabled: Boolean(episodeId && episodeId > 0),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Create a new comment or reply
 */
export function useCreateComment(episodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      isSpoiler = false,
      parentId = null,
    }: {
      content: string;
      isSpoiler?: boolean;
      parentId?: string | null;
    }) => {
      const token = await getAuthToken();
      if (!token) throw new Error('Debes iniciar sesión para comentar.');

      const res = await fetch(`${API_BASE}/comments/episode/${episodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          isSpoiler,
          parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al publicar comentario');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episode-comments', episodeId] });
    },
  });
}

/**
 * Toggle like on a comment
 */
export function useToggleCommentLike(episodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const token = await getAuthToken();
      if (!token) throw new Error('Debes iniciar sesión para dar me gusta.');

      const res = await fetch(`${API_BASE}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al reaccionar');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episode-comments', episodeId] });
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment(episodeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const token = await getAuthToken();
      if (!token) throw new Error('Debes iniciar sesión para eliminar.');

      const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al eliminar');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episode-comments', episodeId] });
    },
  });
}

