import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { useToggleWatchlist, useIsInWatchlist } from '../../hooks/useWatchlist.js';
import { useWatchHistory } from '../../hooks/useWatchHistory.js';
import { formatStatusLabel } from '../../lib/utils.js';

interface HeroCarouselProps {
  animes: any[];
  isLoading?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ animes, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Consume watch history for active viewer profile
  const { data: watchHistory = [] } = useWatchHistory();

  // Gentle auto-slide (only when user is not hovering)
  useEffect(() => {
    if (!animes || animes.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [animes, isHovered]);

  const currentAnime = animes && animes.length > 0 ? animes[currentIndex] : null;

  // Map user watch history for quick lookups
  const historyMap = useMemo(() => {
    const map = new Map<
      number,
      { progress_seconds: number; total_seconds: number; is_completed: boolean; updated_at: string }
    >();
    if (watchHistory) {
      watchHistory.forEach((h: any) => {
        if (h.episode_id) {
          map.set(h.episode_id, {
            progress_seconds: h.progress_seconds || 0,
            total_seconds: h.total_seconds || 0,
            is_completed: Boolean(h.is_completed),
            updated_at: h.updated_at,
          });
        }
      });
    }
    return map;
  }, [watchHistory]);

  // Extract all episodes across all seasons of currentAnime if present
  const allEpisodes = useMemo(() => {
    if (!currentAnime) return [];
    const list: any[] = [];
    const seasons = currentAnime.seasons || currentAnime.series_seasons || [];
    seasons.forEach((season: any) => {
      (season.series_entries || []).forEach((entry: any) => {
        const anime = entry.anime;
        if (anime && Array.isArray(anime.episodes)) {
          anime.episodes.forEach((ep: any) => {
            list.push({ ep, season, anime });
          });
        }
      });
    });
    return list;
  }, [currentAnime]);

  // Determine resume / continue watching episode (identical to AnimeDetailPage)
  const resumeInfo = useMemo(() => {
    if (!currentAnime) return null;

    // 1. Try resolving through preloaded episodes (matching AnimeDetailPage)
    if (allEpisodes.length > 0) {
      const watchedItems = allEpisodes
        .filter((item) => historyMap.has(item.ep.id))
        .map((item) => ({
          ...item,
          history: historyMap.get(item.ep.id)!,
        }))
        .sort((a, b) => new Date(b.history.updated_at).getTime() - new Date(a.history.updated_at).getTime());

      if (watchedItems.length > 0) {
        const latest = watchedItems[0];
        const latestIdx = allEpisodes.findIndex((item) => item.ep.id === latest.ep.id);

        if (latest.history.is_completed && latestIdx < allEpisodes.length - 1) {
          return {
            episodeId: allEpisodes[latestIdx + 1].ep.id,
            episodeNumber: allEpisodes[latestIdx + 1].ep.episode_number,
          };
        }

        return {
          episodeId: latest.ep.id,
          episodeNumber: latest.ep.episode_number,
        };
      }
    }

    // 2. Fallback: match directly from watchHistory via slug or ID
    const targetSlugLower = (currentAnime.slug || '').toLowerCase();
    const targetId = Number(currentAnime.id);

    const matches = (watchHistory || [])
      .filter((h: any) => {
        const ep = h.episode;
        if (!ep) return false;
        if (ep.series_slug && ep.series_slug.toLowerCase() === targetSlugLower) return true;
        if (ep.anime?.slug && ep.anime.slug.toLowerCase() === targetSlugLower) return true;
        if (ep.anime?.id && Number(ep.anime.id) === targetId) return true;
        return false;
      })
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    if (matches.length > 0) {
      const latest = matches[0];
      return {
        episodeId: latest.episode_id || latest.episode?.id,
        episodeNumber: latest.episode?.episode_number,
      };
    }

    return null;
  }, [currentAnime, allEpisodes, historyMap, watchHistory]);

  if (isLoading || !currentAnime) {
    return (
      <div className="w-full h-[460px] sm:h-[520px] rounded-3xl shimmer bg-slate-900/80 mb-12" />
    );
  }

  const title = currentAnime.title_english || currentAnime.title_romaji || currentAnime.name;
  const statusInfo = formatStatusLabel(currentAnime.status);
  const targetSlug = currentAnime.series_slug || currentAnime.slug;
  const firstEpId = allEpisodes.length > 0 ? allEpisodes[0].ep.id : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[480px] sm:h-[520px] rounded-3xl overflow-hidden mb-12 shadow-2xl border border-slate-800/80 group"
    >
      {/* Background Image with Cinematic Gradients */}
      <div className="absolute inset-0 bg-[#07090e]">
        <img
          src={currentAnime.banner_image || currentAnime.cover_image || 'https://totalanime.com/placeholder-banner.webp'}
          alt={title}
          className="w-full h-full object-cover object-top opacity-55 filter saturate-150 transition-all duration-700 transform scale-105"
        />
        {/* Left-to-right gradient for maximum text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/85 sm:via-[#07090e]/75 to-transparent" />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-black/30" />
      </div>

      {/* Slide Content */}
      <div className="relative h-full max-w-3xl flex flex-col justify-end p-6 sm:p-12 z-10 space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="sm" className="font-bold tracking-wider uppercase bg-indigo-600/90 text-white">
            DESTACADO
          </Badge>
          <Badge
            variant={statusInfo.label === 'En Emisión' ? 'emerald' : 'purple'}
            size="sm"
            className="font-medium"
          >
            {statusInfo.label}
          </Badge>
          {currentAnime.format && (
            <Badge variant="slate" size="sm">
              {currentAnime.format}
            </Badge>
          )}
          {currentAnime.season_year && (
            <Badge variant="outline" size="sm">
              {currentAnime.season_year}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-['Outfit'] line-clamp-2 drop-shadow-md">
          {title}
        </h1>

        {/* Genres */}
        {currentAnime.genres && currentAnime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentAnime.genres.slice(0, 4).map((g: any) => (
              <span
                key={g.id || g.slug || g.name}
                className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-3 max-w-2xl leading-relaxed">
          {currentAnime.description || 'Disfruta de esta increíble serie con la mejor calidad y subtítulos en TotalAnime.'}
        </p>

        {/* Action Buttons: Dynamic Resume / Start Watching */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {resumeInfo ? (
            <Link to={`/watch/${targetSlug}/${resumeInfo.episodeId}`}>
              <Button size="lg" leftIcon={<Play className="w-5 h-5 fill-white" />}>
                Continuar Viendo {resumeInfo.episodeNumber ? `(EP ${resumeInfo.episodeNumber})` : ''}
              </Button>
            </Link>
          ) : (
            <Link to={firstEpId ? `/watch/${targetSlug}/${firstEpId}` : `/anime/${targetSlug}`}>
              <Button size="lg" leftIcon={<Play className="w-5 h-5 fill-white" />}>
                Ver Ahora
              </Button>
            </Link>
          )}

          <Link to={`/anime/${targetSlug}`}>
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Info className="w-4 h-4 text-slate-300" />}
            >
              Más información
            </Button>
          </Link>

          <WatchlistHeroButton animeId={currentAnime.id} />
        </div>
      </div>

      {/* Discrete Navigation Arrows */}
      <button
        type="button"
        onClick={() => setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length)}
        aria-label="Anime anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => setCurrentIndex((prev) => (prev + 1) % animes.length)}
        aria-label="Anime siguiente"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators Dots */}
      <div className="absolute bottom-4 right-6 flex items-center gap-2 z-20">
        {animes.map((_, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ir al destacado ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? 'w-8 bg-indigo-500 shadow-md shadow-indigo-500/50'
                : 'w-2 bg-slate-600/60 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const WatchlistHeroButton: React.FC<{ animeId: number }> = ({ animeId }) => {
  const { data: isSaved } = useIsInWatchlist(animeId);
  const toggleMutation = useToggleWatchlist(animeId);

  return (
    <Button
      variant="secondary"
      size="lg"
      isLoading={toggleMutation.isPending}
      onClick={() => toggleMutation.mutate()}
      leftIcon={
        <Bookmark
          className={`w-4 h-4 ${isSaved ? 'fill-indigo-400 text-indigo-400' : 'text-slate-300'}`}
        />
      }
    >
      {isSaved ? 'En Mi Lista' : 'Añadir a Mi Lista'}
    </Button>
  );
};
