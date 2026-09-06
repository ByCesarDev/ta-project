import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { Button } from '../common/Button.js';

interface EpisodeNavigationProps {
  animeSlug: string;
  currentEpisodeNumber: number;
  totalEpisodes: number;
  onOpenEpisodesList?: () => void;
}

export const EpisodeNavigation: React.FC<EpisodeNavigationProps> = ({
  animeSlug,
  currentEpisodeNumber,
  totalEpisodes,
  onOpenEpisodesList,
}) => {
  const hasPrevious = currentEpisodeNumber > 1;
  const hasNext = totalEpisodes > 0 ? currentEpisodeNumber < totalEpisodes : true;

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#0c101c] border border-slate-800/80 mb-8">
      {/* Previous Episode */}
      {hasPrevious ? (
        <Link to={`/watch/${animeSlug}/${currentEpisodeNumber - 1}`}>
          <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Anterior
          </Button>
        </Link>
      ) : (
        <Button variant="secondary" size="sm" disabled leftIcon={<ChevronLeft className="w-4 h-4" />}>
          Anterior
        </Button>
      )}

      {/* Episode Index / List button */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm text-white font-['Outfit']">
          Episodio {currentEpisodeNumber}
        </span>
        {onOpenEpisodesList ? (
          <Button variant="ghost" size="sm" onClick={onOpenEpisodesList} leftIcon={<ListFilter className="w-4 h-4" />}>
            Episodios
          </Button>
        ) : (
          <Link to={`/anime/${animeSlug}`}>
            <Button variant="ghost" size="sm" leftIcon={<ListFilter className="w-4 h-4" />}>
              Ver Lista
            </Button>
          </Link>
        )}
      </div>

      {/* Next Episode */}
      {hasNext ? (
        <Link to={`/watch/${animeSlug}/${currentEpisodeNumber + 1}`}>
          <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            Siguiente
          </Button>
        </Link>
      ) : (
        <Button variant="primary" size="sm" disabled rightIcon={<ChevronRight className="w-4 h-4" />}>
          Siguiente
        </Button>
      )}
    </div>
  );
};
