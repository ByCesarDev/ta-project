import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useWatchHistory } from '../../hooks/useWatchHistory.js';
import { useSeriesCatalog } from '../../hooks/useSeries.js';
import { AnimeCard } from '../common/AnimeCard.js';
import { AnimeCardSkeleton } from '../common/Skeleton.js';

interface PersonalizedRowProps {
  title?: string;
  subtitle?: string;
}

export const PersonalizedRecommendationsRow: React.FC<PersonalizedRowProps> = ({
  title,
  subtitle,
}) => {
  const { data: history = [] } = useWatchHistory();

  // Extract preferred genre from user's history
  const topGenre = React.useMemo(() => {
    if (!history || history.length === 0) return null;

    const genreCounts = new Map<string, { count: number; name: string }>();

    for (const h of history) {
      const anime = h.episode?.anime;
      if (!anime) continue;

      const genres = (anime as any).genres || (anime as any).anime_genres || [];
      for (const g of genres) {
        const item = g.genres || g;
        if (!item?.slug) continue;
        const current = genreCounts.get(item.slug) || { count: 0, name: item.name };
        current.count += 1;
        genreCounts.set(item.slug, current);
      }
    }

    if (genreCounts.size === 0) return null;

    let bestSlug: string | null = null;
    let bestCount = -1;
    let bestName = '';

    genreCounts.forEach((val, slug) => {
      if (val.count > bestCount) {
        bestCount = val.count;
        bestSlug = slug;
        bestName = val.name;
      }
    });

    return bestSlug ? { slug: bestSlug, name: bestName } : null;
  }, [history]);

  // Query personalized series based on top genre (or fallback to top views)
  const { data: catalogData, isLoading } = useSeriesCatalog(
    topGenre
      ? { genreSlug: topGenre.slug, limit: 6, sortBy: 'views' }
      : { limit: 6, sortBy: 'views' }
  );

  const seriesList = (catalogData?.series || []).slice(0, 6);

  // Dynamic header based on user's preference
  const displayTitle =
    title ||
    (topGenre
      ? `Inspirados por tus gustos · ${topGenre.name}`
      : 'Recomendados para ti');

  const displaySubtitle =
    subtitle ||
    (topGenre
      ? `Porque has estado viendo anime de ${topGenre.name}`
      : 'Títulos imperdibles seleccionados para la comunidad');

  if (!isLoading && seriesList.length === 0) {
    return null;
  }

  return (
    <section className="mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
              {displayTitle}
            </h2>
            <p className="text-xs text-slate-400">{displaySubtitle}</p>
          </div>
        </div>

        <Link
          to={topGenre ? `/directory?genre=${topGenre.slug}` : '/directory'}
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 group"
        >
          <span>Explorar más</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {seriesList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
};
