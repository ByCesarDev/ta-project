import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.js';
import { AnimeRow } from '../types/index.js';

export function useWatchlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watch_later')
        .select(`
          id,
          anime_id,
          created_at,
          animes (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        anime_id: item.anime_id,
        created_at: item.created_at,
        anime: item.animes as unknown as AnimeRow,
      }));
    },
    enabled: Boolean(user),
  });
}

export function useIsInWatchlist(animeId?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watchlist', user?.id, 'check', animeId],
    queryFn: async () => {
      if (!user || !animeId) return false;

      const { data, error } = await supabase
        .from('watch_later')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', animeId)
        .maybeSingle();

      if (error) return false;
      return Boolean(data);
    },
    enabled: Boolean(user && animeId),
  });
}

export function useToggleWatchlist(animeId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Debes iniciar sesión para guardar favoritos');
      if (!animeId) throw new Error('Anime no especificado');

      // Check current state
      const { data: existing } = await supabase
        .from('watch_later')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', animeId)
        .maybeSingle();

      if (existing) {
        // Remove
        const { error } = await supabase
          .from('watch_later')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { isSaved: false };
      } else {
        // Insert
        const { error } = await supabase
          .from('watch_later')
          .insert({ user_id: user.id, anime_id: animeId });
        if (error) throw error;
        return { isSaved: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id, 'check', animeId] });
    },
  });
}
