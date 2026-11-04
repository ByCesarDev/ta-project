import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ChevronRight, Swords, Wand2, Heart, Skull, Zap, Smile, Search } from 'lucide-react';
import { useGenres } from '../../hooks/useAnime.js';

interface GenreDiscoverySectionProps {
  title?: string;
  subtitle?: string;
}

// Icon and gradient mappings for top anime genres
const GENRE_THEMES: Record<string, { icon: React.ReactNode; gradient: string; border: string }> = {
  accion: {
    icon: <Swords className="w-5 h-5 text-rose-400" />,
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-500/60',
  },
  fantasia: {
    icon: <Wand2 className="w-5 h-5 text-purple-400" />,
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-500/60',
  },
  romance: {
    icon: <Heart className="w-5 h-5 text-pink-400" />,
    gradient: 'from-pink-500/20 via-pink-500/5 to-transparent',
    border: 'border-pink-500/30 hover:border-pink-500/60',
  },
  comedia: {
    icon: <Smile className="w-5 h-5 text-amber-400" />,
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-500/60',
  },
  sobrenatural: {
    icon: <Skull className="w-5 h-5 text-indigo-400" />,
    gradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
  },
  'ciencia-ficcion': {
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
  },
};

export const GenreDiscoverySection: React.FC<GenreDiscoverySectionProps> = ({
  title = 'Explora por Género y Colección',
  subtitle = 'Encuentra tu próxima historia favorita navegando por temática',
}) => {
  const { data: genres = [], isLoading } = useGenres();

  if (isLoading || genres.length === 0) return null;

  return (
    <section className="mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Outfit']">
              {title}
            </h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <Link
          to="/directory"
          className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 group"
        >
          <span>Todos los géneros</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid of Highlighted Genre Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        {genres.slice(0, 6).map((g) => {
          const theme = GENRE_THEMES[g.slug] || {
            icon: <Search className="w-5 h-5 text-indigo-400" />,
            gradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
            border: 'border-indigo-500/30 hover:border-indigo-500/60',
          };

          return (
            <Link
              key={g.id}
              to={`/directory?genreSlug=${g.slug}`}
              className={`group relative p-4 rounded-2xl bg-gradient-to-br ${theme.gradient} bg-[#0c101c]/90 border ${theme.border} shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between h-28`}
            >
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 w-fit">
                {theme.icon}
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {g.name}
                </h3>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
                  Explorar catálogo →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Pills for remaining genres */}
      {genres.length > 6 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {genres.slice(6, 18).map((g) => (
            <Link
              key={g.id}
              to={`/directory?genreSlug=${g.slug}`}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer font-medium"
            >
              {g.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
