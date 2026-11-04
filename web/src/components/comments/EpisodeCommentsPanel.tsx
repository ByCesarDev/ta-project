import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { EpisodeComments } from './EpisodeComments.js';
import { useEpisodeComments } from '../../hooks/useComments.js';

interface EpisodeCommentsPanelProps {
  episodeId: number;
  animeSlug?: string;
  episodeNumber?: number;
  animeTitle?: string;
}

export const EpisodeCommentsPanel: React.FC<EpisodeCommentsPanelProps> = ({
  episodeId,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  // Prefetch or read comments count
  const { data: commentsData } = useEpisodeComments(episodeId);
  const totalComments = commentsData?.total_count;

  // Close panel and reset when episode changes
  useEffect(() => {
    setIsOpen(false);
  }, [episodeId]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && !hasLoaded) {
        setHasLoaded(true);
      }
      return next;
    });
  };

  return (
    <div className="w-full rounded-2xl bg-[#0c101c] border border-slate-800/80 overflow-hidden shadow-lg transition-all">
      {/* Header Button */}
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls="episode-comments-content"
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-900/40 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
              <span>Comentarios</span>
              {typeof totalComments === 'number' && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
                  {totalComments}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isOpen ? 'Ocultar discusión de la comunidad' : 'Toca para abrir la conversación y opiniones'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {hasLoaded && (
        <div
          id="episode-comments-content"
          className={`p-4 sm:p-6 border-t border-slate-800/80 ${isOpen ? 'block' : 'hidden'}`}
        >
          <EpisodeComments episodeId={episodeId} />
        </div>
      )}
    </div>
  );
};
