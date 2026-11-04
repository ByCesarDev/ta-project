import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.js';
import { useViewerProfile } from '../context/ViewerProfileContext.js';

export function useWatchlist() {
  const { user } = useAuth();
  const { activeProfile } = useViewerProfile();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: ['watchlist', user?.id, profileId],
    queryFn: async () => {
      if (!user) return [];

      const seriesSelect = `
        id,
        series_id,
        created_at,
        series (
          id,
          name,
          slug,
          description,
          cover_image,
          banner_image,
          status,
          views_count,
          series_seasons (
            id,
            series_entries (
              anime:animes (
                id,
                episodes
              )
            )
          )
        )
      `;

      // 1. Query user_favorites for series-level saves
      let seriesFavs: any[] | null = null;
      if (profileId) {
        const { data, error } = await supabase
          .from('user_favorites')
          .select(seriesSelect)
          .eq('viewer_profile_id', profileId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          seriesFavs = data;
        }
      }

      if (!seriesFavs) {
        const { data } = await supabase
          .from('user_favorites')
          .select(seriesSelect)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        seriesFavs = data || [];
      }

      const animeSelect = `
        id,
        anime_id,
        created_at,
        animes (
          id,
          name,
          slug,
          title_romaji,
          title_english,
          cover_image,
          banner_image,
          status,
          episodes,
          views_count,
          series_entries (
            series_seasons (
              series (
                id,
                name,
                slug,
                cover_image,
                banner_image,
                status
              )
            )
          )
        )
      `;

      // 2. Query legacy watch_later for any anime saves
      let animeFavs: any[] | null = null;
      if (profileId) {
        const { data, error } = await supabase
          .from('watch_later')
          .select(animeSelect)
          .eq('viewer_profile_id', profileId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          animeFavs = data;
        }
      }

      if (!animeFavs) {
        const { data } = await supabase
          .from('watch_later')
          .select(animeSelect)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        animeFavs = data || [];
      }

      const results: any[] = [];
      const seenSlugs = new Set<string>();

      // Format series favorites
      (seriesFavs || []).forEach((item: any) => {
        if (!item.series) return;
        const s = item.series;
        const seasons = s.series_seasons || [];
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
            }
          });
        });

        seenSlugs.add(s.slug);
        results.push({
          id: item.id,
          series_id: item.series_id,
          is_series: true,
          created_at: item.created_at,
          anime: {
            id: s.id,
            name: s.name,
            slug: s.slug,
            series_slug: s.slug,
            cover_image: s.cover_image,
            banner_image: s.banner_image,
            status: s.status,
            views_count: s.views_count,
            total_seasons_count: seasons.length,
            total_episodes_count: totalEpisodes,
          },
        });
      });

      // Format legacy/individual anime favorites
      (animeFavs || []).forEach((item: any) => {
        if (!item.animes) return;
        const a = item.animes;
        const entryObj = Array.isArray(a.series_entries) ? a.series_entries[0] : a.series_entries;
        const parentSeries = entryObj?.series_seasons?.series;
        const finalSlug = parentSeries?.slug || a.slug;
        if (seenSlugs.has(finalSlug)) return;

        seenSlugs.add(finalSlug);
        results.push({
          id: item.id,
          anime_id: item.anime_id,
          series_id: parentSeries?.id,
          is_series: Boolean(parentSeries),
          created_at: item.created_at,
          anime: {
            id: parentSeries?.id || a.id,
            name: parentSeries?.name || a.title_english || a.title_romaji || a.name,
            slug: finalSlug,
            series_slug: finalSlug,
            cover_image: parentSeries?.cover_image || a.cover_image,
            banner_image: parentSeries?.banner_image || a.banner_image,
            status: parentSeries?.status || a.status,
            views_count: a.views_count,
            episodes: a.episodes,
          },
        });
      });

      return results;
    },
    enabled: Boolean(user),
  });
}

export function useIsInWatchlist(id?: number) {
  const { user } = useAuth();
  const { activeProfile } = useViewerProfile();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: ['watchlist', user?.id, profileId, 'check', id],
    queryFn: async () => {
      if (!user || !id) return false;

      // 1. Check with profileId if available
      if (profileId) {
        const { data: fav, error: favErr } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('viewer_profile_id', profileId)
          .eq('series_id', id)
          .maybeSingle();

        if (!favErr && fav) return true;

        const { data: wl, error: wlErr } = await supabase
          .from('watch_later')
          .select('id')
          .eq('viewer_profile_id', profileId)
          .eq('anime_id', id)
          .maybeSingle();

        if (!wlErr && wl) return true;
        if (!favErr && !wlErr) return false;
      }

      // 2. Check user_favorites by series_id fallback
      const { data: fav } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('series_id', id)
        .maybeSingle();

      if (fav) return true;

      // 3. Check watch_later by anime_id fallback
      const { data: wl } = await supabase
        .from('watch_later')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', id)
        .maybeSingle();

      return Boolean(wl);
    },
    enabled: Boolean(user && id),
  });
}

export function useToggleWatchlist(id?: number) {
  const { user } = useAuth();
  const { activeProfile } = useViewerProfile();
  const profileId = activeProfile?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Debes iniciar sesión para guardar favoritos');
      if (!id) throw new Error('Elemento no especificado');

      if (profileId) {
        // 1. Check user_favorites with profileId
        const { data: existingFav } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('viewer_profile_id', profileId)
          .eq('series_id', id)
          .maybeSingle();

        if (existingFav) {
          await supabase.from('user_favorites').delete().eq('id', existingFav.id);
          await supabase.from('watch_later').delete().eq('viewer_profile_id', profileId).eq('anime_id', id);
          return { isSaved: false };
        }

        // 2. Check watch_later with profileId
        const { data: existingWl } = await supabase
          .from('watch_later')
          .select('id')
          .eq('viewer_profile_id', profileId)
          .eq('anime_id', id)
          .maybeSingle();

        if (existingWl) {
          await supabase.from('watch_later').delete().eq('id', existingWl.id);
          return { isSaved: false };
        }

        // 3. Try adding with viewer_profile_id
        const { error: favErr } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, viewer_profile_id: profileId, series_id: id });

        if (!favErr) return { isSaved: true };

        const { error: wlErr } = await supabase
          .from('watch_later')
          .insert({ user_id: user.id, viewer_profile_id: profileId, anime_id: id });

        if (!wlErr) return { isSaved: true };
      }

      // Legacy fallback
      const { data: existingFav } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('series_id', id)
        .maybeSingle();

      if (existingFav) {
        await supabase.from('user_favorites').delete().eq('id', existingFav.id);
        await supabase.from('watch_later').delete().eq('user_id', user.id).eq('anime_id', id);
        return { isSaved: false };
      }

      const { data: existingWl } = await supabase
        .from('watch_later')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', id)
        .maybeSingle();

      if (existingWl) {
        await supabase.from('watch_later').delete().eq('id', existingWl.id);
        return { isSaved: false };
      }

      const { error: favErr } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, series_id: id });

      if (favErr) {
        await supabase.from('watch_later').insert({ user_id: user.id, anime_id: id });
      }

      return { isSaved: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id, profileId] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id, profileId, 'check', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id, 'check', id] });
    },
  });
}
