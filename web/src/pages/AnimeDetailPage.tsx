import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useSeriesDetail } from '../hooks/useSeries.js';
import { useIsInWatchlist, useToggleWatchlist } from '../hooks/useWatchlist.js';
import {
  useWatchHistory,
  useToggleEpisodeWatched,
  useToggleSeasonWatched,
} from '../hooks/useWatchHistory.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { DropdownSelect, DropdownOption } from '../components/common/DropdownSelect.js';
import { formatStatusLabel } from '../lib/utils.js';
import {
  Play,
  Bookmark,
  Film,
  Eye,
  ArrowLeft,
  Tv,
  Layers,
  Check,
  CheckCheck,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';

export const AnimeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: series, isLoading, error } = useSeriesDetail(slug || '');

  // Canonical URL sync: If accessed via old anime slug or alias, replace URL with canonical series slug
  useEffect(() => {
    if (series?.slug && slug && series.slug !== slug) {
      navigate(`/anime/${series.slug}`, { replace: true });
    }
  }, [series, slug, navigate]);

  const { data: isSaved } = useIsInWatchlist(series?.id);
  const toggleWatchlistMutation = useToggleWatchlist(series?.id);

  // Watch History data
  const { data: watchHistory } = useWatchHistory();
  const toggleSeasonMutation = useToggleSeasonWatched();

  // Active Season State
  const seasonParam = searchParams.get('season');
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [episodeSortOrder, setEpisodeSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (series?.seasons && series.seasons.length > 0) {
      if (seasonParam) {
        const found = series.seasons.find((s) => String(s.id) === seasonParam);
        if (found) {
          setActiveSeasonId(found.id);
          return;
        }
      }
      // Default to first season
      setActiveSeasonId(series.seasons[0].id);
    }
  }, [series, seasonParam]);

  const handleSelectSeason = (seasonId: number) => {
    setActiveSeasonId(seasonId);
    setSearchParams({ season: String(seasonId) });
  };

  // Map user watch history for quick lookups
  const historyMap = useMemo(() => {
    const map = new Map<
      number,
      { progress_seconds: number; total_seconds: number; is_completed: boolean; updated_at: string }
    >();
    if (watchHistory) {
      watchHistory.forEach((h: any) => {
        if (h.episode_id) {
          map.set(h.episode_id, {
            progress_seconds: h.progress_seconds || 0,
            total_seconds: h.total_seconds || 0,
            is_completed: Boolean(h.is_completed),
            updated_at: h.updated_at,
          });
        }
      });
    }
    return map;
  }, [watchHistory]);

  // Flatten all episodes across all seasons
  const allSeriesEpisodes: any[] = useMemo(() => {
    const list: any[] = [];
    (series?.seasons || []).forEach((season: any) => {
      (season.series_entries || []).forEach((entry: any) => {
        const anime = entry.anime;
        if (anime && Array.isArray(anime.episodes)) {
          anime.episodes.forEach((ep: any) => {
            list.push({ ep, season, anime });
          });
        }
      });
    });
    return list;
  }, [series]);

  // Determine Resume Episode (Continue Watching)
  const resumeEpisodeInfo = useMemo(() => {
    if (!allSeriesEpisodes || allSeriesEpisodes.length === 0) return null;

    const watchedItems = allSeriesEpisodes
      .filter((item) => historyMap.has(item.ep.id))
      .map((item) => ({
        ...item,
        history: historyMap.get(item.ep.id)!,
      }))
      .sort((a, b) => new Date(b.history.updated_at).getTime() - new Date(a.history.updated_at).getTime());

    if (watchedItems.length === 0) return null;

    const latest = watchedItems[0];
    const latestIdx = allSeriesEpisodes.findIndex((item) => item.ep.id === latest.ep.id);

    // If latest was completed and there's a subsequent episode, recommend next episode
    if (latest.history.is_completed && latestIdx < allSeriesEpisodes.length - 1) {
      return {
        episode: allSeriesEpisodes[latestIdx + 1].ep,
        season: allSeriesEpisodes[latestIdx + 1].season,
        isNext: true,
      };
    }

    return {
      episode: latest.ep,
      season: latest.season,
      isNext: false,
    };
  }, [allSeriesEpisodes, historyMap]);

  if (isLoading) {
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

  if (error || !series) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Serie no encontrada</h2>
          <p className="text-sm text-slate-400">
            No pudimos encontrar la serie especificada. Puede que haya sido renombrada o combinada.
          </p>
          <Link to="/directory">
            <Button variant="primary">Volver al Directorio</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const activeSeason = series.seasons?.find((s) => s.id === activeSeasonId) || series.seasons?.[0];

  // Flatten episodes of the active season
  const activeSeasonEpisodes: Array<{ episode: any; partLabel?: string; anime: any }> = [];
  if (activeSeason && activeSeason.series_entries) {
    activeSeason.series_entries.forEach((entry: any) => {
      const anime = entry.anime;
      if (anime && Array.isArray(anime.episodes)) {
        anime.episodes.forEach((ep: any) => {
          activeSeasonEpisodes.push({
            episode: ep,
            partLabel: entry.part_label,
            anime,
          });
        });
      }
    });
  }

  // Sort episodes according to episodeSortOrder (asc / desc)
  const sortedEpisodes = [...activeSeasonEpisodes].sort((a, b) => {
    const numA = Number(a.episode.episode_number);
    const numB = Number(b.episode.episode_number);
    return episodeSortOrder === 'asc' ? numA - numB : numB - numA;
  });

  const statusInfo = formatStatusLabel(series.status);
  
  // Total episodes calculation across all seasons
  const totalEpisodesCount =
    typeof series.total_episodes_count === 'number' && series.total_episodes_count > 0
      ? series.total_episodes_count
      : series.seasons?.reduce((acc: number, s: any) => {
          let sCount = 0;
          s.series_entries?.forEach((e: any) => {
            if (e.anime) {
              const c = typeof e.anime.episodes_count === 'number' && e.anime.episodes_count > 0
                ? e.anime.episodes_count
                : typeof e.anime.episodes === 'number' && e.anime.episodes > 0
                ? e.anime.episodes
                : Array.isArray(e.anime.episodes)
                ? e.anime.episodes.length
                : 0;
              sCount += c;
            }
          });
          return acc + sCount;
        }, 0) || 0;

  const firstEp = activeSeasonEpisodes.length > 0 ? activeSeasonEpisodes[0].episode : null;

  // Check if all episodes in active season are completed
  const isAllSeasonWatched =
    activeSeasonEpisodes.length > 0 &&
    activeSeasonEpisodes.every(({ episode }) => historyMap.get(episode.id)?.is_completed);

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
            src={series.banner_image || series.cover_image || 'https://totalanime.com/placeholder-banner.webp'}
            alt={series.name}
            fetchPriority="high"
            className="w-full h-full object-cover opacity-35 filter saturate-150 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c101c] via-[#0c101c]/60 to-transparent" />
        </div>

        {/* Content Info Overlapping Banner */}
        <div className="relative px-6 sm:px-10 pb-8 -mt-24 sm:-mt-32 flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Poster */}
          <div className="w-44 sm:w-52 md:w-60 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900 mx-auto md:mx-0 z-10">
            <img
              src={series.cover_image || 'https://totalanime.com/placeholder-cover.webp'}
              alt={series.name}
              fetchPriority="high"
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
              <Badge variant="purple" className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {series.seasons?.length || 1} {series.seasons?.length === 1 ? 'Temporada' : 'Temporadas'}
              </Badge>
              <Badge variant="slate">{totalEpisodesCount} Episodios Totales</Badge>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
                {series.name}
              </h1>
              {activeSeason && (
                <p className="text-sm text-indigo-400 font-semibold mt-1">
                  {activeSeason.name} {activeSeason.season_number ? `(Temporada ${activeSeason.season_number})` : ''}
                </p>
              )}
            </div>

            {/* Aggregated Genres */}
            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {series.genres.map((g) => (
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
                {totalEpisodesCount > 0 ? `${totalEpisodesCount} Episodios` : 'En emisión'}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-violet-400" />
                {(series.views_count || 0).toLocaleString()} Reproducciones
              </span>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {series.description || 'Sin sinopsis general disponible para esta serie.'}
            </p>

            {/* Actions: Dynamic Resume / Start Watching */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {resumeEpisodeInfo ? (
                <Link to={`/watch/${series.slug}/${resumeEpisodeInfo.episode.id}`}>
                  <Button size="lg" leftIcon={<Play className="w-5 h-5 fill-white" />}>
                    Continuar Viendo (EP {resumeEpisodeInfo.episode.episode_number})
                  </Button>
                </Link>
              ) : firstEp ? (
                <Link to={`/watch/${series.slug}/${firstEp.id}`}>
                  <Button size="lg" leftIcon={<Play className="w-5 h-5 fill-white" />}>
                    Empezar a Ver (EP {firstEp.episode_number})
                  </Button>
                </Link>
              ) : null}

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

      {/* Crunchyroll-Style Season Selector & Episodes Section */}
      <section className="mb-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c101c] border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Selector de Temporadas
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona la temporada o entrega para ver sus episodios
              </p>
            </div>
          </div>

          {/* Crunchyroll Season Dropdown */}
          {series.seasons && series.seasons.length > 0 && (() => {
            const seasonOptions: DropdownOption<number>[] = series.seasons.map((s) => {
              let epCount = 0;
              s.series_entries?.forEach((e: any) => {
                if (e.anime) {
                  const c = typeof e.anime.episodes_count === 'number' && e.anime.episodes_count > 0
                    ? e.anime.episodes_count
                    : typeof e.anime.episodes === 'number' && e.anime.episodes > 0
                    ? e.anime.episodes
                    : Array.isArray(e.anime.episodes)
                    ? e.anime.episodes.length
                    : 0;
                  epCount += c;
                }
              });

              let badgeText: string | undefined;
              if (epCount > 0) {
                badgeText = `${epCount} eps`;
              } else if (s.kind === 'movie') {
                badgeText = 'Película';
              } else if (s.kind === 'special') {
                badgeText = 'Especial';
              } else if (s.kind === 'ova') {
                badgeText = 'OVA';
              } else if (s.season_number) {
                badgeText = `Temp ${s.season_number}`;
              }

              return {
                value: s.id,
                label: s.name,
                badge: badgeText,
                icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
              };
            });

            return (
              <div className="w-full sm:w-auto min-w-[280px]">
                <DropdownSelect
                  value={activeSeasonId || series.seasons[0].id}
                  onChange={(val) => handleSelectSeason(Number(val))}
                  options={seasonOptions}
                  variant="glow"
                  className="w-full"
                />
              </div>
            );
          })()}
        </div>

        {/* Active Season Episodes Grid Header & Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-400" />
              Episodios de {activeSeason?.name}
              <span className="text-xs text-slate-400 font-normal">
                ({activeSeasonEpisodes.length} disponibles)
              </span>
            </h3>

            {/* Right Controls: Sort Order & Season Bulk Watched Toggle */}
            {activeSeasonEpisodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Episode Sort Dropdown */}
                <div className="w-48">
                  <DropdownSelect
                    value={episodeSortOrder}
                    onChange={(val) => setEpisodeSortOrder(val as 'asc' | 'desc')}
                    options={[
                      { value: 'asc', label: 'Más Antiguos (1 - N)' },
                      { value: 'desc', label: 'Más Recientes (N - 1)' },
                    ]}
                    size="sm"
                  />
                </div>

                {/* Mark All Season as Watched / Unwatched */}
                <button
                  type="button"
                  disabled={toggleSeasonMutation.isPending}
                  onClick={() => {
                    const epIds = activeSeasonEpisodes.map((e) => e.episode.id);
                    toggleSeasonMutation.mutate({
                      episodeIds: epIds,
                      markAsWatched: !isAllSeasonWatched,
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm cursor-pointer ${
                    isAllSeasonWatched
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAllSeasonWatched ? 'Desmarcar Temporada' : 'Marcar Temporada'}</span>
                </button>
              </div>
            )}
          </div>

          {activeSeasonEpisodes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0c101c] border border-slate-800 text-slate-400 text-xs">
              Aún no hay episodios disponibles para esta temporada.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedEpisodes.map(({ episode: ep, partLabel, anime }) => {
                const isAvailable = ep.status === 'available';
                const epHistory = historyMap.get(ep.id);
                const isWatched = Boolean(epHistory?.is_completed);
                const isResumeTarget = resumeEpisodeInfo?.episode?.id === ep.id;
                const progressPct =
                  epHistory && epHistory.total_seconds > 0
                    ? Math.min(100, Math.round((epHistory.progress_seconds / epHistory.total_seconds) * 100))
                    : 0;

                return (
                  <div
                    key={ep.id}
                    className={`group relative flex flex-col rounded-2xl overflow-hidden bg-[#0c101c] border transition-all duration-300 hover:-translate-y-1 shadow-md ${
                      isResumeTarget
                        ? 'border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                        : isWatched
                        ? 'border-emerald-500/40 bg-[#0c101c]/90'
                        : 'border-slate-800 hover:border-indigo-500/50'
                    }`}
                  >
                    <Link
                      to={`/watch/${series.slug}/${ep.id}`}
                      className="block relative aspect-video w-full overflow-hidden bg-slate-900"
                    >
                      <img
                        src={
                          ep.thumbnail ||
                          anime.cover_image ||
                          series.cover_image ||
                          'https://totalanime.com/placeholder-cover.webp'
                        }
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

                      {/* Episode Number Badge */}
                      <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                        EP {ep.episode_number}
                      </div>

                      {/* Part Label */}
                      {partLabel && (
                        <div className="absolute top-2 left-2 bg-purple-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-md">
                          {partLabel}
                        </div>
                      )}

                      {/* Watched Checkmark */}
                      {isWatched && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-md shadow-sm">
                          <Check className="w-3 h-3" />
                          <span>Visto</span>
                        </div>
                      )}

                      {/* Pending status badge if not available */}
                      {!isAvailable && (
                        <div className="absolute top-2 right-2 bg-amber-500/80 text-black font-bold text-[9px] px-1.5 py-0.5 rounded">
                          Pendiente
                        </div>
                      )}

                      {/* Resume indicator */}
                      {isResumeTarget && !isWatched && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-md animate-pulse">
                          Siguiente
                        </div>
                      )}

                      {/* Progress Bar at bottom of thumbnail */}
                      {progressPct > 0 && !isWatched && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </Link>

                    {/* Card Footer Info with 3-Dots Menu */}
                    <div className="p-2.5 flex items-center justify-between gap-2">
                      <Link
                        to={`/watch/${series.slug}/${ep.id}`}
                        className="font-semibold text-xs text-slate-200 group-hover:text-indigo-400 line-clamp-1 flex-1"
                        title={ep.title || `Episodio ${ep.episode_number}`}
                      >
                        {ep.title || `Episodio ${ep.episode_number}`}
                      </Link>

                      {/* 3-Dots Options Menu */}
                      <EpisodeCardMenu episodeId={ep.id} isWatched={isWatched} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
};

/**
 * 3-Dots Context Menu on Episode Card
 */
const EpisodeCardMenu: React.FC<{
  episodeId: number;
  isWatched: boolean;
}> = ({ episodeId, isWatched }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleMutation = useToggleEpisodeWatched();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative z-20 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-6 h-6 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60 cursor-pointer"
        title="Opciones"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-[#0c101c]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-1.5 space-y-1 text-xs"
        >
          <button
            type="button"
            disabled={toggleMutation.isPending}
            onClick={() => {
              toggleMutation.mutate({
                episodeId,
                currentlyCompleted: isWatched,
              });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors text-left font-medium cursor-pointer"
          >
            {isWatched ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Desmarcar como visto</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Marcar como visto</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
