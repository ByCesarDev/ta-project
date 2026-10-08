import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useWatchEpisode } from '../hooks/useSeries.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { EpisodeReactions } from '../components/player/EpisodeReactions.js';
import { DisqusComments } from '../components/comments/DisqusComments.js';
import { EpisodeSourceRow, StreamLanguage } from '../types/index.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { ArrowLeft, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Badge } from '../components/common/Badge.js';

export const WatchPage: React.FC = () => {
  const { slug, episodeId, episodeNumber } = useParams<{
    slug: string;
    episodeId?: string;
    episodeNumber?: string;
  }>();
  const navigate = useNavigate();

  const rawIdentifier = episodeId || episodeNumber || '1';
  const { data: watchData, isLoading, error } = useWatchEpisode(slug || '', rawIdentifier);

  // Canonical URL sync: If the current URL slug is an alias or old anime slug, replace URL with canonical series slug
  useEffect(() => {
    if (watchData?.series?.slug && slug && watchData.series.slug !== slug && watchData.episode?.id) {
      navigate(`/watch/${watchData.series.slug}/${watchData.episode.id}`, { replace: true });
    }
  }, [watchData, slug, navigate]);

  const [selectedAudioVariant, setSelectedAudioVariant] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<StreamLanguage>('sub');
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [selectedSource, setSelectedSource] = useState<EpisodeSourceRow | null>(null);

  // Available languages detected from sources
  const availableLanguages: StreamLanguage[] = React.useMemo(() => {
    if (!watchData?.sources || watchData.sources.length === 0) return ['sub', 'dub'];
    const langs = Array.from(new Set(watchData.sources.map((s) => s.language)));
    return langs.length > 0 ? langs : ['sub', 'dub'];
  }, [watchData]);

  // When sources load, select best matching source
  useEffect(() => {
    if (watchData?.sources && watchData.sources.length > 0) {
      let matchedSources = watchData.sources.filter(
        (s) => (s.audio_variant || s.language) === selectedAudioVariant
      );

      if (matchedSources.length === 0) {
        const first = watchData.sources[0];
        const defaultKey = first.audio_variant || first.language || 'sub';
        setSelectedAudioVariant(defaultKey);
        setSelectedLanguage(first.language || 'sub');
        matchedSources = watchData.sources.filter(
          (s) => (s.audio_variant || s.language) === defaultKey
        );
      }

      if (matchedSources.length > 0) {
        if (selectedQuality !== 'Auto') {
          const qualityMatch = matchedSources.find(
            (s) => s.quality === selectedQuality || s.quality?.toLowerCase().includes(selectedQuality.toLowerCase())
          );
          setSelectedSource(qualityMatch || matchedSources[0]);
        } else {
          setSelectedSource(matchedSources[0]);
        }
      } else {
        setSelectedSource(null);
      }
    } else {
      setSelectedSource(null);
    }
  }, [watchData, selectedAudioVariant, selectedQuality]);

  const handleAudioVariantChange = (variantKey: string) => {
    setSelectedAudioVariant(variantKey);
    if (watchData?.sources) {
      const matching = watchData.sources.filter(
        (s) => (s.audio_variant || s.language) === variantKey
      );
      if (matching.length > 0) {
        setSelectedLanguage(matching[0].language || 'sub');
        if (selectedQuality !== 'Auto') {
          const qualityMatch = matching.find(
            (s) => s.quality === selectedQuality || s.quality?.toLowerCase().includes(selectedQuality.toLowerCase())
          );
          setSelectedSource(qualityMatch || matching[0]);
        } else {
          setSelectedSource(matching[0]);
        }
      }
    }
  };

  const handleLanguageChange = (lang: StreamLanguage) => {
    setSelectedLanguage(lang);
    if (watchData?.sources) {
      const matching = watchData.sources.filter((s) => s.language === lang);
      if (matching.length > 0) {
        setSelectedAudioVariant(matching[0].audio_variant || matching[0].language);
        if (selectedQuality !== 'Auto') {
          const qualityMatch = matching.find(
            (s) => s.quality === selectedQuality || s.quality?.toLowerCase().includes(selectedQuality.toLowerCase())
          );
          setSelectedSource(qualityMatch || matching[0]);
        } else {
          setSelectedSource(matching[0]);
        }
      }
    }
  };

  const handleQualityChange = (qual: string) => {
    setSelectedQuality(qual);
    if (watchData?.sources) {
      const currentSources = watchData.sources.filter((s) => {
        if (selectedAudioVariant) {
          return (s.audio_variant || s.language) === selectedAudioVariant;
        }
        return s.language === selectedLanguage;
      });

      if (currentSources.length > 0) {
        if (qual !== 'Auto') {
          const match = currentSources.find(
            (s) => s.quality === qual || s.quality?.toLowerCase().includes(qual.toLowerCase())
          );
          if (match) setSelectedSource(match);
        } else {
          setSelectedSource(currentSources[0]);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="w-full aspect-video rounded-3xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !watchData) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Episodio no encontrado</h2>
          <p className="text-xs text-slate-400">
            No pudimos localizar el episodio solicitado para esta serie.
          </p>
          <Link to={`/anime/${slug}`}>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
              Ver Ficha de la Serie
            </button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const { series, season, episode, allEpisodes } = watchData;
  const currentIndex = allEpisodes.findIndex((item) => item.episode.id === episode.id);
  const prevEpItem = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpItem = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header Breadcrumb & Season Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/anime/${series.slug}?season=${season?.id || ''}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a {series.name}
          </Link>

          <div className="flex items-center gap-2">
            {season && (
              <Badge variant="purple" size="sm" className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {season.name}
              </Badge>
            )}
            <Badge variant="primary" size="sm">
              Episodio {episode.episode_number}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
            {series.name} — {season?.name ? `${season.name}: ` : ''}Episodio {episode.episode_number}
          </h1>
          {episode.title && (
            <p className="text-xs text-slate-400 mt-0.5">{episode.title}</p>
          )}
        </div>

        {/* Video Player */}
        <VideoPlayer
          episodeId={episode.id}
          selectedSource={selectedSource}
          availableSources={watchData.sources}
          animeTitle={series.name}
          episodeNumber={episode.episode_number}
          availableLanguages={availableLanguages}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageChange}
          selectedAudioVariant={selectedAudioVariant}
          onSelectAudioVariant={handleAudioVariantChange}
          selectedQuality={selectedQuality}
          onSelectQuality={handleQualityChange}
          hasNextEpisode={Boolean(nextEpItem)}
          onSelectNextEpisode={() => {
            if (nextEpItem) {
              navigate(`/watch/${series.slug}/${nextEpItem.episode.id}`);
            }
          }}
        />

        {/* Episode Quick Switcher Bar */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c101c] border border-slate-800 shadow-xl">
          {/* Prev Button */}
          <button
            disabled={!prevEpItem}
            onClick={() => prevEpItem && navigate(`/watch/${series.slug}/${prevEpItem.episode.id}`)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              prevEpItem
                ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-md'
                : 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900/50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Episodio Anterior
          </button>

          {/* Next Button */}
          <button
            disabled={!nextEpItem}
            onClick={() => nextEpItem && navigate(`/watch/${series.slug}/${nextEpItem.episode.id}`)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              nextEpItem
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
                : 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900/50'
            }`}
          >
            Siguiente Episodio
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Reactions */}
        <EpisodeReactions
          animeSlug={series.slug}
          episodeNumber={episode.episode_number}
          animeTitle={series.name}
        />

        {/* Disqus Community Comments */}
        <DisqusComments
          animeSlug={series.slug}
          episodeNumber={episode.episode_number}
          animeTitle={series.name}
        />
      </div>
    </PageContainer>
  );
};
