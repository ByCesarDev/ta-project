import React from 'react';
import { EpisodeSourceRow, StreamLanguage } from '../../types/index.js';
import { TotalAnimePlayer, SubtitleTrack } from './TotalAnimePlayer.js';

interface VideoPlayerProps {
  episodeId: number;
  selectedSource: EpisodeSourceRow | null;
  availableSources?: EpisodeSourceRow[];
  animeTitle?: string;
  episodeNumber?: number;
  durationMinutes?: number;
  availableLanguages?: StreamLanguage[];
  selectedLanguage?: StreamLanguage;
  onSelectLanguage?: (lang: StreamLanguage) => void;
  selectedAudioVariant?: string;
  onSelectAudioVariant?: (variant: string) => void;
  selectedQuality?: string;
  onSelectQuality?: (quality: string) => void;
  subtitles?: SubtitleTrack[];
  onSelectNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episodeId,
  selectedSource,
  availableSources,
  animeTitle,
  episodeNumber,
  availableLanguages,
  selectedLanguage,
  onSelectLanguage,
  selectedAudioVariant,
  onSelectAudioVariant,
  selectedQuality,
  onSelectQuality,
  subtitles,
  onSelectNextEpisode,
  hasNextEpisode,
}) => {
  return (
    <TotalAnimePlayer
      episodeId={episodeId}
      animeTitle={animeTitle}
      episodeNumber={episodeNumber}
      selectedSource={selectedSource}
      availableSources={availableSources}
      availableLanguages={availableLanguages}
      selectedLanguage={selectedLanguage}
      onSelectLanguage={onSelectLanguage}
      selectedAudioVariant={selectedAudioVariant}
      onSelectAudioVariant={onSelectAudioVariant}
      selectedQuality={selectedQuality}
      onSelectQuality={onSelectQuality}
      subtitles={subtitles}
      onSelectNextEpisode={onSelectNextEpisode}
      hasNextEpisode={hasNextEpisode}
    />
  );
};
