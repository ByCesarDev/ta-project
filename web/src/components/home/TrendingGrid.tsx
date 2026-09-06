import React from 'react';
import { Flame } from 'lucide-react';
import { AnimeWithGenres } from '../../types/index.js';
import { AnimeCard } from '../common/AnimeCard.js';
import { AnimeCardSkeleton } from '../common/Skeleton.js';

interface TrendingGridProps {
  animes: AnimeWithGenres[];
  isLoading?: boolean;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({ animes, isLoading }) => {
  return (
    <section className="mb-14">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-['Outfit']">
            Tendencias y Más Populares
          </h2>
          <p className="text-xs text-slate-400">Los títulos más reproducidos de la comunidad</p>
        </div>
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
          {animes.map((anime, index) => (
            <AnimeCard key={anime.id} anime={anime} showRank={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
};
