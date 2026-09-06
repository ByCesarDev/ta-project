import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useAnimeDetails } from '../hooks/useAnime.js';
import { useAnimeEpisodes } from '../hooks/useEpisodes.js';
import { useIsInWatchlist, useToggleWatchlist } from '../hooks/useWatchlist.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { formatStatusLabel } from '../lib/utils.js';
import {
  Play,
  Bookmark,
  Star,
  Film,
  Calendar,
  Eye,
  ArrowLeft,
  Tv,
} from 'lucide-react';

export const AnimeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: anime, isLoading: loadingAnime, error } = useAnimeDetails(slug || '');
  const { data: episodes, isLoading: loadingEpisodes } = useAnimeEpisodes(anime?.id);

  const { data: isSaved } = useIsInWatchlist(anime?.id);
  const toggleWatchlistMutation = useToggleWatchlist(anime?.id);

  if (loadingAnime) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="w-full h-80 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Skeleton className="aspect-[3/4] rounded-2xl md:col-span-1" />
            <div className="md:col-span-3 space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !anime) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Anime no encontrado</h2>
          <p className="text-sm text-slate-400">
            No pudimos encontrar la serie especificada. Puede que haya sido renombrada o eliminada.
          </p>
          <Link to="/directory">
            <Button variant="primary">Volver al Directorio</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const title = anime.title_english || anime.title_romaji || anime.name;
  const statusInfo = formatStatusLabel(anime.status);

  return (
    <PageContainer>
      {/* Back Button */}
      <Link
        to="/directory"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Directorio
      </Link>

      {/* Hero Banner Container */}
      <div className="relative rounded-3xl overflow-hidden mb-10 border border-slate-800/80 bg-[#0c101c] shadow-2xl">
        {/* Banner Backdrop */}
        <div className="relative w-full h-56 sm:h-72 lg:h-80 overflow-hidden bg-slate-900">
          <img
            src={anime.banner_image || anime.cover_image || 'https://totalanime.com/placeholder-banner.webp'}
            alt={title}
            className="w-full h-full object-cover opacity-35 filter saturate-150 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c101c] via-[#0c101c]/60 to-transparent" />
        </div>

        {/* Content Info Overlapping Banner */}
        <div className="relative px-6 sm:px-10 pb-8 -mt-24 sm:-mt-32 flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Poster */}
          <div className="w-44 sm:w-52 md:w-60 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900 mx-auto md:mx-0 z-10">
            <img
              src={anime.cover_image || 'https://totalanime.com/placeholder-cover.webp'}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text & Metadata */}
          <div className="flex-1 space-y-4 text-center md:text-left z-10">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant={statusInfo.label === 'En Emisión' ? 'emerald' : 'primary'}>
                {statusInfo.label}
              </Badge>
              {anime.format && <Badge variant="slate">{anime.format}</Badge>}
              {anime.season_year && <Badge variant="outline">{anime.season_year}</Badge>}
              <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9
              </span>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
                {title}
              </h1>
              {anime.title_romaji && anime.title_romaji !== title && (
                <p className="text-sm text-slate-400 italic mt-0.5">{anime.title_romaji}</p>
              )}
              {anime.title_native && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">{anime.title_native}</p>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {anime.genres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/directory?genre=${g.slug}`}
                    className="text-xs px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-indigo-500/50 hover:text-white transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 py-1">
              <span className="flex items-center gap-1.5">
                <Film className="w-4 h-4 text-indigo-400" />
                {anime.episodes > 0 ? `${anime.episodes} Episodios` : 'En emisión'}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-violet-400" />
                {anime.views_count.toLocaleString()} Reproducciones
              </span>
              {anime.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Estreno: {anime.start_date}
                </span>
              )}
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {anime.description || 'Sin sinopsis disponible para este anime.'}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {episodes && episodes.length > 0 && (
                <Link to={`/watch/${anime.slug}/${episodes[0].episode_number}`}>
                  <Button size="lg" leftIcon={<Play className="w-5 h-5 fill-white" />}>
                    Empezar a Ver (EP {episodes[0].episode_number})
                  </Button>
                </Link>
              )}

              <Button
                variant="secondary"
                size="lg"
                isLoading={toggleWatchlistMutation.isPending}
                onClick={() => toggleWatchlistMutation.mutate()}
                leftIcon={
                  <Bookmark
                    className={`w-5 h-5 ${
                      isSaved ? 'fill-indigo-400 text-indigo-400' : 'text-slate-300'
                    }`}
                  />
                }
              >
                {isSaved ? 'En Mi Lista' : 'Añadir a Favoritos'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Tv className="w-5 h-5 text-indigo-500" />
            Lista de Episodios
            <span className="text-xs text-slate-400 font-normal">
              ({episodes?.length || 0} disponibles)
            </span>
          </h2>
        </div>

        {loadingEpisodes ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
            ))}
          </div>
        ) : !episodes || episodes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0c101c] border border-slate-800 text-slate-400 text-xs">
            Aún no hay episodios cargados para esta serie.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {episodes.map((ep) => {
              const isAvailable = ep.status === 'available';
              return (
                <Link
                  key={ep.id}
                  to={`/watch/${anime.slug}/${ep.episode_number}`}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-[#0c101c] border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={ep.thumbnail || anime.cover_image || 'https://totalanime.com/placeholder-cover.webp'}
                      alt={`Episodio ${ep.episode_number}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                      EP {ep.episode_number}
                    </div>

                    {!isAvailable && (
                      <div className="absolute top-2 right-2 bg-amber-500/80 text-black font-bold text-[9px] px-1.5 py-0.5 rounded">
                        Pendiente
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-indigo-400 line-clamp-1">
                      {ep.title || `Episodio ${ep.episode_number}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageContainer>
  );
};
