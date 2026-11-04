import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useWatchEpisode } from '../hooks/useSeries.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { EpisodeInfo } from '../components/player/EpisodeInfo.js';
import { EpisodeNavigationCards } from '../components/player/EpisodeNavigationCards.js';
import { EpisodeCommentsPanel } from '../components/comments/EpisodeCommentsPanel.js';
import { EpisodeSourceRow, StreamLanguage } from '../types/index.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { ArrowLeft } from 'lucide-react';

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

  const [selectedAudioVariant, setSelectedAudioVariant] = useState<string>(() => {
    return localStorage.getItem('ta_player_audio_variant') || '';
  });
  const [selectedLanguage, setSelectedLanguage] = useState<StreamLanguage>(() => {
    return (localStorage.getItem('ta_player_language') as StreamLanguage) || 'sub';
  });
  const [selectedQuality, setSelectedQuality] = useState<string>(() => {
    return localStorage.getItem('ta_player_quality') || 'Auto';
  });
  const [selectedSource, setSelectedSource] = useState<EpisodeSourceRow | null>(null);

  // Available languages detected from sources
  const availableLanguages: StreamLanguage[] = React.useMemo(() => {
    if (!watchData?.sources || watchData.sources.length === 0) return ['sub', 'dub'];
    const langs = Array.from(new Set(watchData.sources.map((s) => s.language)));
    return langs.length > 0 ? langs : ['sub', 'dub'];
  }, [watchData]);

  // When sources load, select best matching source according to user preference
  useEffect(() => {
    if (watchData?.sources && watchData.sources.length > 0) {
      const savedVariant = selectedAudioVariant || localStorage.getItem('ta_player_audio_variant') || '';
      const savedCode = localStorage.getItem('ta_player_audio_code') || '';
      const savedLang = selectedLanguage || (localStorage.getItem('ta_player_language') as StreamLanguage) || 'sub';

      // 1. Try matching by active or saved audio variant
      let matchedSources = savedVariant
        ? watchData.sources.filter((s) => (s.audio_variant || s.language) === savedVariant)
        : [];

      // 2. If no exact variant match, match by audio language code (e.g. 'es', 'es-419', 'ja')
      if (matchedSources.length === 0 && savedCode) {
        matchedSources = watchData.sources.filter(
          (s) =>
            s.audio_language &&
            (s.audio_language.toLowerCase() === savedCode.toLowerCase() ||
              s.audio_language.toLowerCase().startsWith(savedCode.slice(0, 2).toLowerCase()))
        );
      }

      // 3. If still no match, match by stream language ('dub' vs 'sub')
      if (matchedSources.length === 0 && savedLang) {
        matchedSources = watchData.sources.filter((s) => s.language === savedLang);
      }

      // 4. Fallback to first source if nothing matched
      if (matchedSources.length === 0) {
        const first = watchData.sources[0];
        const defaultKey = first.audio_variant || first.language || 'sub';
        setSelectedAudioVariant(defaultKey);
        setSelectedLanguage(first.language || 'sub');
        matchedSources = [first];
      } else {
        const chosen = matchedSources[0];
        const key = chosen.audio_variant || chosen.language || 'sub';
        setSelectedAudioVariant(key);
        setSelectedLanguage(chosen.language || 'sub');
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
  }, [watchData, selectedQuality]);

  const handleAudioVariantChange = (variantKey: string) => {
    setSelectedAudioVariant(variantKey);
    localStorage.setItem('ta_player_audio_variant', variantKey);

    if (watchData?.sources) {
      const matching = watchData.sources.filter(
        (s) => (s.audio_variant || s.language) === variantKey
      );
      if (matching.length > 0) {
        const lang = matching[0].language || 'sub';
        setSelectedLanguage(lang);
        localStorage.setItem('ta_player_language', lang);
        if (matching[0].audio_language) {
          localStorage.setItem('ta_player_audio_code', matching[0].audio_language);
        }

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
    localStorage.setItem('ta_player_language', lang);

    if (watchData?.sources) {
      const matching = watchData.sources.filter((s) => s.language === lang);
      if (matching.length > 0) {
        const key = matching[0].audio_variant || matching[0].language;
        setSelectedAudioVariant(key);
        localStorage.setItem('ta_player_audio_variant', key);
        if (matching[0].audio_language) {
          localStorage.setItem('ta_player_audio_code', matching[0].audio_language);
        }

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
    localStorage.setItem('ta_player_quality', qual);

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
      <div className="mx-auto space-y-5">
        {/* Discrete Back Link to Series */}
        <div className="pt-1">
          <Link
            to={`/anime/${series.slug}${season?.id ? `?season=${season.id}` : ''}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            <span>Volver a {series.name}</span>
          </Link>
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

        {/* Main Content & Navigation Block */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start pt-1">
          {/* Left Column: Info, Reactions & Synopsis */}
          <div className="min-w-0">
            <EpisodeInfo
              seriesName={series.name}
              seriesSlug={series.slug}
              seriesId={series.id}
              seasonId={season?.id}
              seasonName={season?.name}
              partLabel={watchData.anime?.name && watchData.anime.name !== series.name ? watchData.anime.name : null}
              episodeId={episode.id}
              episodeNumber={episode.episode_number}
              episodeTitle={episode.title}
              thumbnail={episode.thumbnail || watchData.anime?.banner_image || series.banner_image || series.cover_image}
              duration={episode.duration}
              synopsis={episode.description || null}
            />
          </div>

          {/* Right Column: Navigation Cards */}
          {(prevEpItem || nextEpItem) && (
            <div className="min-w-0 w-full">
              <EpisodeNavigationCards
                seriesSlug={series.slug}
                seriesCover={series.cover_image}
                seriesBanner={series.banner_image}
                prevEpisode={prevEpItem}
                nextEpisode={nextEpItem}
              />
            </div>
          )}
        </div>

        {/* Collapsible Native Comments (Turso) */}
        <div className="pt-2">
          <EpisodeCommentsPanel
            episodeId={episode.id}
            animeSlug={series.slug}
            episodeNumber={episode.episode_number}
            animeTitle={series.name}
          />
        </div>
      </div>
    </PageContainer>
  );
};
