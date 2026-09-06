import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useEpisodeWithSources, useAnimeEpisodes } from '../hooks/useEpisodes.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { ServerSelector } from '../components/player/ServerSelector.js';
import { EpisodeNavigation } from '../components/player/EpisodeNavigation.js';
import { EpisodeSourceRow, StreamLanguage } from '../types/index.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { ArrowLeft, Tv } from 'lucide-react';

export const WatchPage: React.FC = () => {
  const { slug, episodeNumber } = useParams<{ slug: string; episodeNumber: string }>();
  const navigate = useNavigate();

  const epNum = parseInt(episodeNumber || '1', 10);
  const { data: episodeData, isLoading: loadingEpisode, error } = useEpisodeWithSources(
    slug || '',
    epNum
  );

  const { data: allEpisodes } = useAnimeEpisodes(episodeData?.anime?.id);

  const [selectedLanguage, setSelectedLanguage] = useState<StreamLanguage>('sub');
  const [selectedSource, setSelectedSource] = useState<EpisodeSourceRow | null>(null);

  // When episode sources load, select the highest priority source for the current language
  useEffect(() => {
    if (episodeData?.sources && episodeData.sources.length > 0) {
      // Find sources matching language
      let matching = episodeData.sources.filter((s) => s.language === selectedLanguage);
      if (matching.length === 0) {
        // Fallback to whatever language is available
        const firstAvailableLang = episodeData.sources[0].language;
        setSelectedLanguage(firstAvailableLang);
        matching = episodeData.sources.filter((s) => s.language === firstAvailableLang);
      }

      if (matching.length > 0) {
        setSelectedSource(matching[0]);
      } else {
        setSelectedSource(null);
      }
    } else {
      setSelectedSource(null);
    }
  }, [episodeData, selectedLanguage]);

  const handleLanguageChange = (lang: StreamLanguage) => {
    setSelectedLanguage(lang);
    if (episodeData?.sources) {
      const matching = episodeData.sources.filter((s) => s.language === lang);
      if (matching.length > 0) {
        setSelectedSource(matching[0]);
      }
    }
  };

  if (loadingEpisode) {
    return (
      <PageContainer>
        <div className="space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="w-full aspect-video-player rounded-3xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !episodeData) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Episodio no encontrado</h2>
          <p className="text-xs text-slate-400">
            No pudimos localizar el episodio #{epNum} para esta serie. Verifica la URL o consulta la lista completa de episodios.
          </p>
          <Link to={`/anime/${slug}`}>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
              Ver Ficha del Anime
            </button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const { anime, episode, sources } = episodeData;
  const animeTitle = anime.title_english || anime.title_romaji || anime.name;

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link
            to={`/anime/${anime.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a {animeTitle}
          </Link>

          <span className="text-xs text-indigo-400 font-semibold font-['Outfit']">
            Reproduciendo Episodio {episode.episode_number}
          </span>
        </div>

        {/* Anime & Episode Title */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
            {animeTitle} - Episodio {episode.episode_number}
          </h1>
          {episode.title && (
            <p className="text-xs text-slate-400 mt-0.5">{episode.title}</p>
          )}
        </div>

        {/* Video Player */}
        <VideoPlayer
          episodeId={episode.id}
          selectedSource={selectedSource}
          durationMinutes={episode.duration ? Math.round(episode.duration / 60) : 24}
        />

        {/* Server Selector */}
        <ServerSelector
          sources={sources}
          selectedSourceId={selectedSource?.id ?? null}
          onSelectSource={(source) => setSelectedSource(source)}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageChange}
        />

        {/* Episode Navigation Bar */}
        <EpisodeNavigation
          animeSlug={anime.slug}
          currentEpisodeNumber={episode.episode_number}
          totalEpisodes={anime.episodes || allEpisodes?.length || 0}
          availableEpisodes={allEpisodes}
        />

        {/* Quick Episode Grid Selector */}
        {allEpisodes && allEpisodes.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800/80 mb-12 shadow-xl">
            <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2 mb-4">
              <Tv className="w-4 h-4 text-indigo-400" />
              Todos los Episodios ({allEpisodes.length})
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {allEpisodes.map((ep) => {
                const isCurrent = ep.episode_number === episode.episode_number;
                return (
                  <button
                    key={ep.id}
                    onClick={() => navigate(`/watch/${anime.slug}/${ep.episode_number}`)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {ep.episode_number}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
