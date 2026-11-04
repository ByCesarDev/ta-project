import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronRight } from 'lucide-react';
import { useSeriesCatalog } from '../../hooks/useSeries.js';
import { AnimeCard } from '../common/AnimeCard.js';
import { AnimeCardSkeleton } from '../common/Skeleton.js';

interface TrendingGridProps {
  animes?: any[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({
  animes: externalAnimes,
  isLoading: externalLoading,
  title = 'Tendencias y Más Populares',
  subtitle = 'Los títulos más reproducidos de la comunidad',
}) => {
  // Query independent popular series if not passed externally
  const { data: popularData, isLoading: catalogLoading } = useSeriesCatalog(
    externalAnimes ? undefined : { limit: 12, sortBy: 'views' }
  );

  const animes = externalAnimes || popularData?.series || [];
  const isLoading = externalLoading !== undefined ? externalLoading : catalogLoading;

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Outfit']">
              {title}
            </h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <Link
          to="/directory?sortBy=views"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 group"
        >
          <span>Ver ranking completo</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : animes.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#0c101c] border border-slate-800 text-slate-400 text-xs">
          No hay animes disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {animes.slice(0, 12).map((anime, index) => (
            <AnimeCard key={anime.id} anime={anime} showRank={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
};
