import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { DisqusComments } from './DisqusComments.js';

interface EpisodeCommentsPanelProps {
  animeSlug: string;
  episodeNumber: number;
  animeTitle: string;
}

export const EpisodeCommentsPanel: React.FC<EpisodeCommentsPanelProps> = ({
  animeSlug,
  episodeNumber,
  animeTitle,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  // Close panel and reset when episode changes
  useEffect(() => {
    setIsOpen(false);
  }, [animeSlug, episodeNumber]);

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
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-900/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
              <span>Comentarios</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isOpen ? 'Ocultar discusión de la comunidad' : 'Toca para abrir la conversación y opiniones'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://disqus.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-slate-500 hover:text-slate-400 hidden sm:flex items-center gap-1 transition-colors"
          >
            Disqus <ExternalLink className="w-3 h-3" />
          </a>
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
          <DisqusComments
            animeSlug={animeSlug}
            episodeNumber={episodeNumber}
            animeTitle={animeTitle}
            variant="bare"
          />
        </div>
      )}
    </div>
  );
};
