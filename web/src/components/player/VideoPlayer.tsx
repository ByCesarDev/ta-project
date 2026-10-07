import React from 'react';
import { EpisodeSourceRow } from '../../types/index.js';
import { TotalAnimePlayer } from './TotalAnimePlayer.js';

interface VideoPlayerProps {
  episodeId: number;
  selectedSource: EpisodeSourceRow | null;
  animeTitle?: string;
  episodeNumber?: number;
  durationMinutes?: number;
  onSelectNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episodeId,
  selectedSource,
  animeTitle,
  episodeNumber,
  onSelectNextEpisode,
  hasNextEpisode,
}) => {
  return (
    <TotalAnimePlayer
      episodeId={episodeId}
      animeTitle={animeTitle}
      episodeNumber={episodeNumber}
      selectedSource={selectedSource}
      onSelectNextEpisode={onSelectNextEpisode}
      hasNextEpisode={hasNextEpisode}
    />
  );
};
