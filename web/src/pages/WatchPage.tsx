import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useEpisodeWithSources, useAnimeEpisodes } from '../hooks/useEpisodes.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { EpisodeNavigation } from '../components/player/EpisodeNavigation.js';
import { EpisodeReactions } from '../components/player/EpisodeReactions.js';
import { DisqusComments } from '../components/comments/DisqusComments.js';
import { EpisodeSourceRow, StreamLanguage } from '../types/index.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { ArrowLeft } from 'lucide-react';

export const WatchPage: React.FC = () => {
  const { slug, episodeNumber } = useParams<{ slug: string; episodeNumber: string }>();
  const navigate = useNavigate();

  const epNum = parseInt(episodeNumber || '1', 10);
  const { data: episodeData, isLoading: loadingEpisode, error } = useEpisodeWithSources(
    slug || '',
    epNum
  );

  const { data: allEpisodes } = useAnimeEpisodes(episodeData?.anime?.id);

  const [selectedAudioVariant, setSelectedAudioVariant] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<StreamLanguage>('sub');
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [selectedSource, setSelectedSource] = useState<EpisodeSourceRow | null>(null);

  // Available languages detected from sources
  const availableLanguages: StreamLanguage[] = React.useMemo(() => {
    if (!episodeData?.sources || episodeData.sources.length === 0) return ['sub', 'dub'];
    const langs = Array.from(new Set(episodeData.sources.map((s) => s.language)));
    return langs.length > 0 ? langs : ['sub', 'dub'];
  }, [episodeData]);

  // When episode sources load or audio/quality changes, select the best matching source
  useEffect(() => {
    if (episodeData?.sources && episodeData.sources.length > 0) {
      let matchedSources = episodeData.sources.filter(
        (s) => (s.audio_variant || s.language) === selectedAudioVariant
      );

      if (matchedSources.length === 0) {
        // Fallback to first source
        const first = episodeData.sources[0];
        const defaultKey = first.audio_variant || first.language || 'sub';
        setSelectedAudioVariant(defaultKey);
        setSelectedLanguage(first.language || 'sub');
        matchedSources = episodeData.sources.filter(
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
  }, [episodeData, selectedAudioVariant, selectedQuality]);

  const handleAudioVariantChange = (variantKey: string) => {
    setSelectedAudioVariant(variantKey);
    if (episodeData?.sources) {
      const matching = episodeData.sources.filter(
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
    if (episodeData?.sources) {
      const matching = episodeData.sources.filter((s) => s.language === lang);
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
    if (episodeData?.sources) {
      const currentSources = episodeData.sources.filter((s) => {
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

  const { anime, episode } = episodeData;
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

        {/* Video Player (with embedded audio track, custom subtitles, and quality settings in cog) */}
        <VideoPlayer
          episodeId={episode.id}
          selectedSource={selectedSource}
          availableSources={episodeData.sources}
          animeTitle={animeTitle}
          episodeNumber={episode.episode_number}
          availableLanguages={availableLanguages}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageChange}
          selectedAudioVariant={selectedAudioVariant}
          onSelectAudioVariant={handleAudioVariantChange}
          selectedQuality={selectedQuality}
          onSelectQuality={handleQualityChange}
          hasNextEpisode={Boolean(allEpisodes && allEpisodes.some((e) => e.episode_number === episode.episode_number + 1))}
          onSelectNextEpisode={() => navigate(`/watch/${anime.slug}/${episode.episode_number + 1}`)}
        />

        {/* Episode Navigation Bar (Anterior / Siguiente) */}
        <EpisodeNavigation
          animeSlug={anime.slug}
          currentEpisodeNumber={episode.episode_number}
          totalEpisodes={anime.episodes || allEpisodes?.length || 0}
          availableEpisodes={allEpisodes}
        />

        {/* Reactions & Actions Bar (Likes, Dislikes, Share, Bookmark) */}
        <EpisodeReactions
          animeSlug={anime.slug}
          episodeNumber={episode.episode_number}
          animeTitle={animeTitle}
        />

        {/* Disqus Community Comments */}
        <DisqusComments
          animeSlug={anime.slug}
          episodeNumber={episode.episode_number}
          animeTitle={animeTitle}
        />
      </div>
    </PageContainer>
  );
};
