import React from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useWatchHistory } from '../hooks/useWatchHistory.js';
import { useAuth } from '../context/AuthContext.js';
import { History, Play, CheckCircle2, LogIn, Compass } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { formatTime } from '../lib/utils.js';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { data: history, isLoading } = useWatchHistory();

  if (!user) {
    return (
      <PageContainer>
        <div className="py-24 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto">
            <History className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            Historial de Reproducción
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inicia sesión para guardar automáticamente el minuto exacto donde dejaste cada episodio y retomar tu serie en cualquier momento.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/login">
              <Button leftIcon={<LogIn className="w-4 h-4" />}>Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-2.5">
          <History className="w-7 h-7 text-violet-400" />
          Historial de Reproducción
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {history?.length || 0} episodios vistos recientemente
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#0c101c] border border-slate-800 p-3 space-y-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0c101c] border border-slate-800/80 max-w-lg mx-auto">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base font-['Outfit'] mb-1">
            Sin historial todavía
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Cuando empieces a ver episodios en TotalAnime, tu progreso se guardará automáticamente aquí.
          </p>
          <Link to="/directory">
            <Button leftIcon={<Compass className="w-4 h-4" />}>Comenzar a Explorar</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((item) => {
            const ep = item.episode;
            if (!ep || !ep.anime) return null;

            const percentage =
              item.total_seconds > 0
                ? Math.min(100, Math.round((item.progress_seconds / item.total_seconds) * 100))
                : 0;

            const animeTitle = ep.anime.title_english || ep.anime.title_romaji || ep.anime.name;

            return (
              <div
                key={item.id}
                className="flex flex-col rounded-2xl overflow-hidden bg-[#0c101c] border border-slate-800 hover:border-violet-500/50 transition-all duration-300 shadow-md group"
              >
                {/* Thumbnail & Play Overlay */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={ep.thumbnail || ep.anime.cover_image || 'https://totalanime.com/placeholder-cover.webp'}
                    alt={animeTitle}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  <Link
                    to={`/watch/${ep.anime.slug}/${ep.episode_number}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </Link>

                  <div className="absolute bottom-2 left-2 bg-black/80 text-white font-extrabold text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                    EP {ep.episode_number}
                  </div>

                  {item.is_completed && (
                    <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Visto
                    </div>
                  )}

                  {/* Bottom Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-100 group-hover:text-violet-400 line-clamp-1">
                      {animeTitle}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ep.title || `Episodio ${ep.episode_number}`}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span>
                      {formatTime(item.progress_seconds)} / {formatTime(item.total_seconds)} ({percentage}%)
                    </span>
                    <Link
                      to={`/watch/${ep.anime.slug}/${ep.episode_number}`}
                      className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5"
                    >
                      Continuar →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
