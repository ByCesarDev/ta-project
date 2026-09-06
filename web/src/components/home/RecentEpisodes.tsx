import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { Skeleton } from '../common/Skeleton.js';

interface RecentEpisodeItem {
  id: number;
  episode_number: number;
  title?: string | null;
  thumbnail?: string | null;
  created_at: string;
  animes: {
    id: number;
    name: string;
    slug: string;
    cover_image?: string | null;
  } | null;
}

interface RecentEpisodesProps {
  episodes: RecentEpisodeItem[];
  isLoading?: boolean;
}

export const RecentEpisodes: React.FC<RecentEpisodesProps> = ({ episodes, isLoading }) => {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
              Últimos Episodios
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">Capítulos recién agregados listos para ver</p>
          </div>
        </div>

        <Link
          to="/directory"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Ver Todo el Catálogo →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="p-2.5 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#0c101c] border border-slate-800 text-slate-400 text-xs">
          No hay episodios recientes disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {episodes.map((ep) => {
            if (!ep.animes) return null;
            return (
              <Link
                key={ep.id}
                to={`/watch/${ep.animes.slug}/${ep.episode_number}`}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#0c101c]/80 border border-slate-800/80 hover:border-indigo-500/50 shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={ep.thumbnail || ep.animes.cover_image || 'https://totalanime.com/placeholder-cover.webp'}
                    alt={ep.animes.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Episode Number Badge */}
                  <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md backdrop-blur-md shadow-md border border-indigo-400/30">
                    EP {ep.episode_number}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <h3
                    className="font-bold text-xs text-slate-100 group-hover:text-indigo-400 line-clamp-1 leading-snug font-['Outfit']"
                    title={ep.animes.name}
                  >
                    {ep.animes.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {ep.title ? ep.title : `Episodio ${ep.episode_number}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
