import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, Check } from 'lucide-react';
import { useEpisodeProgress } from '../../hooks/useWatchHistory.js';

export interface NavigationEpisodeItem {
  episode: {
    id: number;
    episode_number: number;
    title?: string | null;
    thumbnail?: string | null;
    duration?: number | string | null;
    status?: string | null;
  };
  season?: {
    id: number;
    name?: string | null;
  };
  anime?: {
    id: number;
    name?: string | null;
    cover_image?: string | null;
    banner_image?: string | null;
  };
}

interface EpisodeNavigationCardsProps {
  seriesSlug: string;
  seriesCover?: string | null;
  seriesBanner?: string | null;
  prevEpisode?: NavigationEpisodeItem | null;
  nextEpisode?: NavigationEpisodeItem | null;
}

function formatDuration(duration?: number | string | null): string | null {
  if (!duration) return null;
  const num = typeof duration === 'number' ? duration : parseInt(String(duration), 10);
  if (isNaN(num) || num <= 0) return null;
  if (num > 100) {
    return `${Math.round(num / 60)} min`;
  }
  return `${num} min`;
}

function cleanEpisodeTitle(episodeNumber: number, title?: string | null): string {
  if (!title) return `Episodio ${episodeNumber}`;
  const clean = title.trim();
  const lower = clean.toLowerCase();
  if (
    lower === `episodio ${episodeNumber}` ||
    lower === `episode ${episodeNumber}` ||
    lower === `capítulo ${episodeNumber}` ||
    lower === `e${episodeNumber}`
  ) {
    return `Episodio ${episodeNumber}`;
  }
  return `E${episodeNumber} · ${clean}`;
}

const NavigationCard: React.FC<{
  type: 'next' | 'prev';
  item: NavigationEpisodeItem;
  seriesSlug: string;
  seriesCover?: string | null;
  seriesBanner?: string | null;
}> = ({ type, item, seriesSlug, seriesCover, seriesBanner }) => {
  const [imgError, setImgError] = useState(false);
  const { data: progress } = useEpisodeProgress(item.episode.id);

  const isCompleted = progress?.is_completed || false;
  const durationText = formatDuration(item.episode.duration);
  const titleText = cleanEpisodeTitle(item.episode.episode_number, item.episode.title);

  // Fallback image chain
  const imageUrl = !imgError
    ? item.episode.thumbnail ||
      item.anime?.banner_image ||
      item.anime?.cover_image ||
      seriesBanner ||
      seriesCover
    : null;

  const isNext = type === 'next';

  return (
    <Link
      to={`/watch/${seriesSlug}/${item.episode.id}`}
      className="group relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0c101c] border border-slate-800/80 hover:border-indigo-500/50 hover:bg-[#111728] transition-all min-h-[88px] sm:min-h-[96px] shadow-md"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* 16:9 Thumbnail */}
        <div className="relative w-24 sm:w-28 aspect-video flex-shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={titleText}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-700 font-mono text-xs font-bold">
              E{item.episode.episode_number}
            </div>
          )}

          {/* Hover Play Indicator */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex flex-col justify-center space-y-1">
          {/* Tag */}
          <div
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isNext ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            {isNext ? 'Siguiente Episodio' : 'Episodio Anterior'}
          </div>

          {/* Title */}
          <h4 className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors truncate">
            {titleText}
          </h4>

          {/* Secondary info (duration or watched badge) */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                <Check className="w-2.5 h-2.5" />
                Visto
              </span>
            )}
            {durationText && <span>{durationText}</span>}
          </div>
        </div>
      </div>

      {/* Right Navigation Arrow */}
      <div className="flex-shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors pl-1">
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  );
};

export const EpisodeNavigationCards: React.FC<EpisodeNavigationCardsProps> = ({
  seriesSlug,
  seriesCover,
  seriesBanner,
  prevEpisode,
  nextEpisode,
}) => {
  if (!prevEpisode && !nextEpisode) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Next Episode Card First */}
      {nextEpisode && (
        <NavigationCard
          type="next"
          item={nextEpisode}
          seriesSlug={seriesSlug}
          seriesCover={seriesCover}
          seriesBanner={seriesBanner}
        />
      )}

      {/* Previous Episode Card Second */}
      {prevEpisode && (
        <NavigationCard
          type="prev"
          item={prevEpisode}
          seriesSlug={seriesSlug}
          seriesCover={seriesCover}
          seriesBanner={seriesBanner}
        />
      )}
    </div>
  );
};

