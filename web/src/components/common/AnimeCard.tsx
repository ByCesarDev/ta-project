import React from 'react';
import { Link } from 'react-router-dom';
import { AnimeRow, AnimeWithGenres } from '../../types/index.js';
import { Play, Star, Film } from 'lucide-react';
import { Badge } from './Badge.js';
import { formatStatusLabel } from '../../lib/utils.js';

interface AnimeCardProps {
  anime: AnimeRow | AnimeWithGenres;
  showRank?: number;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, showRank }) => {
  const statusInfo = formatStatusLabel(anime.status);
  const title = anime.title_english || anime.title_romaji || anime.name;

  return (
    <Link
      to={`/anime/${anime.slug}`}
      className="group relative flex flex-col anime-card-zoom rounded-2xl overflow-hidden bg-[#0c101c]/80 border border-slate-800/80 shadow-lg hover:border-indigo-500/50"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        <img
          src={anime.cover_image || 'https://totalanime.com/placeholder-cover.webp'}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay on Bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-black/20" />

        {/* Optional Ranking Number (Top Animes) */}
        {showRank !== undefined && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-indigo-600/90 backdrop-blur-md flex items-center justify-center font-extrabold text-white text-sm shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            #{showRank}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <Badge
            variant={statusInfo.label === 'En Emisión' ? 'emerald' : 'primary'}
            size="xs"
            className="shadow-md backdrop-blur-md"
          >
            {statusInfo.label}
          </Badge>
          {anime.format && (
            <Badge variant="slate" size="xs" className="shadow-md bg-black/60 backdrop-blur-md text-slate-300">
              {anime.format}
            </Badge>
          )}
        </div>

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40 transform group-hover:scale-110 transition-transform duration-300 border border-indigo-400/40">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Episode Count & Year Badge */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-300 font-medium">
          <span className="flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md">
            <Film className="w-3 h-3 text-indigo-400" />
            {anime.episodes > 0 ? `${anime.episodes} eps` : 'En emisión'}
          </span>
          {anime.season_year && (
            <span className="bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md">
              {anime.season_year}
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 flex flex-col flex-grow justify-between bg-gradient-to-b from-[#0c101c] to-[#080b14]">
        <h3
          className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 leading-snug font-['Outfit']"
          title={title}
        >
          {title}
        </h3>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 font-mono">
            {anime.views_count.toLocaleString()} vistas
          </span>
          <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-semibold">
            <Star className="w-3 h-3 fill-amber-400" /> 4.8
          </span>
        </div>
      </div>
    </Link>
  );
};
