import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useWatchlist, useToggleWatchlist } from '../hooks/useWatchlist.js';
import { useSavedEpisodes, useRemoveSavedEpisode, SavedEpisodeItem } from '../hooks/useSavedEpisodes.js';
import { useAuth } from '../context/AuthContext.js';
import { useViewerProfile } from '../context/ViewerProfileContext.js';
import { Bookmark, Trash2, LogIn, Compass, Tv, Play, Film } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { AnimeCardSkeleton, Skeleton } from '../components/common/Skeleton.js';
import { AnimeCard } from '../components/common/AnimeCard.js';

export const WatchlistPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProfile } = useViewerProfile();
  const [activeTab, setActiveTab] = useState<'series' | 'episodes'>('series');

  const { data: watchlist, isLoading: isWatchlistLoading } = useWatchlist();
  const { data: savedEpisodes, isLoading: isEpisodesLoading } = useSavedEpisodes();
  const removeSavedEpisodeMutation = useRemoveSavedEpisode();

  if (!user) {
    return (
      <PageContainer>
        <div className="py-24 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            Guarda tus animes y episodios favoritos
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inicia sesión o crea una cuenta para añadir series y episodios a tu lista de seguimiento y acceder a ellos desde cualquier dispositivo.
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

  const seriesCount = watchlist?.length || 0;
  const episodesCount = savedEpisodes?.length || 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-indigo-400" />
            Mi Lista de Favoritos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'series'
              ? `${seriesCount} ${seriesCount === 1 ? 'serie guardada' : 'series guardadas'} en el perfil de ${activeProfile?.display_name || activeProfile?.name || 'tu cuenta'}`
              : `${episodesCount} ${episodesCount === 1 ? 'episodio guardado' : 'episodios guardados'} en el perfil de ${activeProfile?.display_name || activeProfile?.name || 'tu cuenta'}`}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'series'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Series ({seriesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'episodes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Episodios ({episodesCount})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Series Watchlist */}
      {activeTab === 'series' && (
        <>
          {isWatchlistLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          ) : !watchlist || watchlist.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0c101c] border border-slate-800/80 max-w-lg mx-auto">
              <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base font-['Outfit'] mb-1">
                No tienes series guardadas
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Aún no has añadido ningún anime a tus favoritos. Explora el catálogo y agrégalos con el botón de marcador.
              </p>
              <Link to="/directory">
                <Button leftIcon={<Compass className="w-4 h-4" />}>Explorar Catálogo</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map((item) => (
                <div key={item.id} className="relative group">
                  <AnimeCard anime={item.anime} />
                  <RemoveWatchlistButton animeId={item.series_id || item.anime_id || item.anime?.id} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Saved Episodes Watchlist */}
      {activeTab === 'episodes' && (
        <>
          {isEpisodesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-video w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
              ))}
            </div>
          ) : !savedEpisodes || savedEpisodes.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0c101c] border border-slate-800/80 max-w-lg mx-auto">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base font-['Outfit'] mb-1">
                No tienes episodios guardados
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Cuando estés viendo cualquier anime, pulsa el botón "Guardar" debajo del reproductor para tener tus episodios favoritos a mano o verlos más tarde.
              </p>
              <Link to="/directory">
                <Button leftIcon={<Compass className="w-4 h-4" />}>Explorar Catálogo</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedEpisodes.map((ep) => (
                <SavedEpisodeCard
                  key={ep.id}
                  ep={ep}
                  onRemove={(episodeId) => removeSavedEpisodeMutation.mutate(episodeId)}
                  isRemoving={removeSavedEpisodeMutation.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

const SavedEpisodeCard: React.FC<{
  ep: SavedEpisodeItem;
  onRemove: (episodeId: number) => void;
  isRemoving: boolean;
}> = ({ ep, onRemove, isRemoving }) => {
  const [imgError, setImgError] = useState(false);
  const title = ep.episode_title || `Episodio ${ep.episode_number}`;
  const hasThumbnail = Boolean(ep.thumbnail && ep.thumbnail.trim() !== '' && !imgError);

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#0c101c] border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 shadow-md">
      <Link
        to={`/watch/${ep.anime_slug}/${ep.episode_id}`}
        className="block relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-slate-800/60"
      >
        {hasThumbnail ? (
          <img
            src={ep.thumbnail!}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#111728] to-indigo-950/40 p-3 text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1.5">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-300 font-['Outfit'] line-clamp-1">
              {ep.anime_title}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Episodio {ep.episode_number}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />

        {/* Play Icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Episode Badge */}
        <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded backdrop-blur-md shadow">
          EP {ep.episode_number}
        </div>

        {/* Duration Badge */}
        {ep.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-slate-300 font-semibold text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md">
            {ep.duration}
          </div>
        )}
      </Link>

      {/* Card Info */}
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            to={`/anime/${ep.anime_slug}`}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 line-clamp-1 block"
          >
            {ep.anime_title}
          </Link>
          <Link
            to={`/watch/${ep.anime_slug}/${ep.episode_id}`}
            className="text-xs font-bold text-white group-hover:text-indigo-300 line-clamp-1 mt-0.5 block"
            title={title}
          >
            {title}
          </Link>
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(ep.episode_id)}
          disabled={isRemoving}
          title="Quitar de guardados"
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RemoveWatchlistButton: React.FC<{ animeId: number }> = ({ animeId }) => {
  const toggleMutation = useToggleWatchlist(animeId);

  return (
    <button
      title="Eliminar de favoritos"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMutation.mutate();
      }}
      disabled={toggleMutation.isPending}
      className="absolute top-2 left-2 z-20 w-8 h-8 rounded-lg bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md border border-white/10 cursor-pointer"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};
