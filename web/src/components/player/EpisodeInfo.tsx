import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EpisodeReactions } from './EpisodeReactions.js';

interface EpisodeInfoProps {
  seriesName: string;
  seriesSlug: string;
  seriesId?: number;
  seasonId?: number;
  seasonName?: string | null;
  partLabel?: string | null;
  episodeId: number;
  episodeNumber: number;
  episodeTitle?: string | null;
  duration?: number | string | null;
  synopsis?: string | null;
}

/**
 * Formats duration into readable string (e.g. 24 -> "24 min", 1450s -> "24 min")
 */
function formatDuration(duration?: number | string | null): string | null {
  if (!duration) return null;
  const num = typeof duration === 'number' ? duration : parseInt(String(duration), 10);
  if (isNaN(num) || num <= 0) return null;

  // If already in seconds (e.g. > 100), convert to minutes
  if (num > 100) {
    const mins = Math.round(num / 60);
    return `${mins} min`;
  }
  return `${num} min`;
}

/**
 * Cleans up generated or duplicate titles so we don't display "E2 · Episodio 2"
 */
function formatEpisodeDisplayTitle(episodeNumber: number, title?: string | null): string {
  if (!title) return `Episodio ${episodeNumber}`;

  const clean = title.trim();
  const lower = clean.toLowerCase();

  // If title is literally "Episodio X", "Episode X", "Capítulo X", or duplicates number
  if (
    lower === `episodio ${episodeNumber}` ||
    lower === `episode ${episodeNumber}` ||
    lower === `capítulo ${episodeNumber}` ||
    lower === `capitulo ${episodeNumber}` ||
    lower === `e${episodeNumber}` ||
    lower === `${episodeNumber}`
  ) {
    return `Episodio ${episodeNumber}`;
  }

  // Remove redundant series prefix if title is "Series Name: Episode Name"
  const colonIdx = clean.indexOf(':');
  if (colonIdx > 0 && colonIdx < clean.length - 2) {
    const afterColon = clean.substring(colonIdx + 1).trim();
    if (afterColon.length > 0 && !afterColon.toLowerCase().startsWith('episodio')) {
      return `E${episodeNumber} · ${afterColon}`;
    }
  }

  return `E${episodeNumber} · ${clean}`;
}

export const EpisodeInfo: React.FC<EpisodeInfoProps> = ({
  seriesName,
  seriesSlug,
  seriesId,
  seasonId,
  seasonName,
  partLabel,
  episodeId,
  episodeNumber,
  episodeTitle,
  duration,
  synopsis,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Reset expanded state when episode changes
  useEffect(() => {
    setIsExpanded(false);
  }, [episodeId, episodeNumber]);

  const displayTitle = formatEpisodeDisplayTitle(episodeNumber, episodeTitle);
  const formattedDuration = formatDuration(duration);

  // Metadata segments
  const metaSegments: string[] = [];
  if (seasonName) metaSegments.push(seasonName);
  if (partLabel) metaSegments.push(partLabel);
  if (formattedDuration) metaSegments.push(formattedDuration);

  // Determine if synopsis is long enough to need a toggle (e.g. > 180 characters)
  const cleanSynopsis = synopsis?.trim() || '';
  const isLongSynopsis = cleanSynopsis.length > 180;

  return (
    <div className="space-y-3.5 min-w-0">
      {/* Series Name Link */}
      <div>
        <Link
          to={`/anime/${seriesSlug}${seasonId ? `?season=${seasonId}` : ''}`}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-block"
        >
          {seriesName}
        </Link>
      </div>

      {/* Main Single H1 Episode Title */}
      <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight leading-snug break-words">
        {displayTitle}
      </h1>

      {/* Season, Part, Duration metadata row */}
      {metaSegments.length > 0 && (
        <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 flex-wrap">
          {metaSegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-600 font-bold">•</span>}
              <span>{segment}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Compact Actions Row */}
      <div className="pt-1">
        <EpisodeReactions
          animeSlug={seriesSlug}
          episodeNumber={episodeNumber}
          animeTitle={seriesName}
          seriesId={seriesId}
          variant="inline"
        />
      </div>

      {/* Episode Synopsis */}
      {cleanSynopsis.length > 0 && (
        <div className="pt-2">
          <p
            className={`text-sm text-slate-300 leading-relaxed ${
              !isExpanded && isLongSynopsis ? 'line-clamp-3' : ''
            }`}
          >
            {cleanSynopsis}
          </p>
          {isLongSynopsis && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>{isExpanded ? 'Ver menos' : 'Ver más'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
