import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, ChevronRight } from 'lucide-react';
import { useWatchHistory } from '../../hooks/useWatchHistory.js';
import { useViewerProfile } from '../../context/ViewerProfileContext.js';
import { Skeleton } from '../common/Skeleton.js';

interface ContinueWatchingRowProps {
  title?: string;
  subtitle?: string;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  title = 'Seguir viendo',
  subtitle = 'Continúa justo donde lo dejaste en este perfil',
}) => {
  const { activeProfile } = useViewerProfile();
  const { data: history = [], isLoading } = useWatchHistory();

  // Filter items: only in-progress or recently watched episodes, deduplicated by anime
  const continueItems = React.useMemo(() => {
    if (!history || history.length === 0) return [];

    const seenAnime = new Set<string | number>();
    const filtered: typeof history = [];

    for (const item of history) {
      if (!item.episode) continue;

      const epAny = item.episode as any;
      const animeIdentifier =
        epAny.anime?.id ||
        epAny.anime?.slug ||
        epAny.series_slug ||
        item.episode_id;

      if (!seenAnime.has(animeIdentifier)) {
        seenAnime.add(animeIdentifier);

        // Calculate progress percentage
        const progress = item.progress_seconds || 0;
        const total = item.total_seconds || 0;
        const isFinished = item.is_completed || (total > 0 && progress >= total - 15);

        // Keep item if it has progress, or if recent
        filtered.push({
          ...item,
          _percent: total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0,
          _remainingMin: total > progress ? Math.max(1, Math.round((total - progress) / 60)) : null,
          _isFinished: isFinished,
        } as any);
      }

      if (filtered.length >= 8) break;
    }

    return filtered;
  }, [history]);

  if (isLoading) {
    return (
      <section className="mb-14">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="p-3 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If no continue watching items exist for this profile, omit row cleanly
  if (continueItems.length === 0) {
    return null;
  }

  return (
    <section className="mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
              {title}
              {activeProfile && (
                <span className="text-[11px] font-normal text-indigo-400 font-mono">
                  · {activeProfile.display_name || activeProfile.name}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <Link
          to="/history"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
        >
          <span>Historial completo</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {continueItems.map((item: any) => {
          const ep = item.episode;
          if (!ep) return null;

          const animeName = ep.anime?.name || 'Anime';
          const targetSlug = ep.series_slug || ep.anime?.slug;
          const thumbnail = ep.thumbnail || ep.anime?.cover_image || 'https://totalanime.com/placeholder-cover.webp';
          const percent = item._percent || 0;
          const remainingMin = item._remainingMin;

          return (
            <Link
              key={item.id}
              to={`/watch/${targetSlug}/${ep.episode_number ?? ep.id}`}
              className="group flex flex-col rounded-2xl overflow-hidden bg-[#0c101c]/80 border border-slate-800/80 hover:border-indigo-500/50 shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img
                  src={thumbnail}
                  alt={animeName}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play overlay button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Episode Badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white font-bold text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                  EP {ep.episode_number}
                </div>

                {/* Remaining Minutes Badge */}
                {remainingMin && !item._isFinished && (
                  <div className="absolute top-2 right-2 bg-indigo-950/80 backdrop-blur-md text-indigo-300 font-medium text-[10px] px-2 py-0.5 rounded-md border border-indigo-500/30">
                    {remainingMin} min restantes
                  </div>
                )}

                {/* Progress bar inside thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, percent)}%` }}
                  />
                </div>
              </div>

              {/* Episode Info */}
              <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {animeName}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {ep.title ? `${ep.title}` : `Episodio ${ep.episode_number}`}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40">
                  <span>{item._isFinished ? 'Visto' : `${percent}% completado`}</span>
                  <span className="text-indigo-400 group-hover:underline">Continuar →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
