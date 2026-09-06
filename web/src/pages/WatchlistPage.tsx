import React from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useWatchlist, useToggleWatchlist } from '../hooks/useWatchlist.js';
import { useAuth } from '../context/AuthContext.js';
import { Bookmark, Trash2, LogIn, Compass } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { AnimeCardSkeleton } from '../components/common/Skeleton.js';
import { AnimeCard } from '../components/common/AnimeCard.js';

export const WatchlistPage: React.FC = () => {
  const { user } = useAuth();
  const { data: watchlist, isLoading } = useWatchlist();

  if (!user) {
    return (
      <PageContainer>
        <div className="py-24 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            Guarda tus animes favoritos
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inicia sesión o crea una cuenta para añadir series a tu lista de seguimiento y acceder a ellas desde cualquier dispositivo.
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-indigo-400" />
            Mi Lista de Favoritos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {watchlist?.length || 0} series guardadas en tu cuenta
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : !watchlist || watchlist.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0c101c] border border-slate-800/80 max-w-lg mx-auto">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base font-['Outfit'] mb-1">
            Tu lista está vacía
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
              <RemoveWatchlistButton animeId={item.anime_id} />
            </div>
          ))}
        </div>
      )}
    </PageContainer>
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
      className="absolute top-2 left-2 z-20 w-8 h-8 rounded-lg bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md border border-white/10"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};
