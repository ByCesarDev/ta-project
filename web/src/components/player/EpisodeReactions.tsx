import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Check } from 'lucide-react';
import { useIsInWatchlist, useToggleWatchlist } from '../../hooks/useWatchlist.js';
import { useAuth } from '../../context/AuthContext.js';

interface EpisodeReactionsProps {
  animeSlug: string;
  episodeNumber: number;
  animeTitle: string;
  seriesId?: number;
  variant?: 'inline' | 'default';
}

export const EpisodeReactions: React.FC<EpisodeReactionsProps> = ({
  animeSlug,
  episodeNumber,
  animeTitle,
  seriesId,
  variant = 'default',
}) => {
  const { user } = useAuth();
  const storageKey = `ta_reaction_${animeSlug}_ep_${episodeNumber}`;
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Real watchlist status from Supabase (if user is authenticated)
  const { data: isInWatchlist } = useIsInWatchlist(seriesId);
  const toggleWatchlistMutation = useToggleWatchlist(seriesId);

  // Local fallback for guest users
  const [localSaved, setLocalSaved] = useState<boolean>(() => {
    return localStorage.getItem(`ta_saved_${animeSlug}`) === 'true';
  });

  const isSaved = user && seriesId ? Boolean(isInWatchlist) : localSaved;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'like' || saved === 'dislike') {
      setReaction(saved);
    } else {
      setReaction(null);
    }
  }, [storageKey]);

  const handleLike = () => {
    if (reaction === 'like') {
      setReaction(null);
      localStorage.removeItem(storageKey);
    } else {
      setReaction('like');
      localStorage.setItem(storageKey, 'like');
    }
  };

  const handleDislike = () => {
    if (reaction === 'dislike') {
      setReaction(null);
      localStorage.removeItem(storageKey);
    } else {
      setReaction('dislike');
      localStorage.setItem(storageKey, 'dislike');
    }
  };

  const handleShare = async () => {
    try {
      // Clean canonical share URL without hash or temp query parameters
      const shareUrl = window.location.origin + window.location.pathname;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: `${animeTitle} - Episodio ${episodeNumber}`,
            url: shareUrl,
          });
        } catch {
          // Ignore user cancel
        }
      }
    } catch {
      // Ignore share errors
    }
  };

  const handleBookmarkToggle = () => {
    if (user && seriesId) {
      toggleWatchlistMutation.mutate();
    } else {
      setLocalSaved((prev) => {
        const next = !prev;
        localStorage.setItem(`ta_saved_${animeSlug}`, String(next));
        return next;
      });
    }
  };

  const isInline = variant === 'inline';

  return (
    <div
      className={
        isInline
          ? 'flex items-center gap-2 flex-wrap py-1'
          : 'flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 rounded-2xl bg-[#0c101c] border border-slate-800/80 mb-6 shadow-lg'
      }
    >
      {/* Reactions Section */}
      <div className="flex items-center gap-2">
        {/* Like Button */}
        <button
          onClick={handleLike}
          aria-label="Me gusta este episodio"
          aria-pressed={reaction === 'like'}
          className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl text-xs font-bold transition-all border ${
            reaction === 'like'
              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title="Me gusta este episodio"
        >
          <ThumbsUp className={`w-4 h-4 ${reaction === 'like' ? 'fill-indigo-400' : ''}`} />
          <span className="text-[11px] font-medium hidden sm:inline">Me gusta</span>
        </button>

        {/* Dislike Button */}
        <button
          onClick={handleDislike}
          aria-label="No me gusta"
          aria-pressed={reaction === 'dislike'}
          className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl text-xs font-bold transition-all border ${
            reaction === 'dislike'
              ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 shadow-md shadow-rose-600/20'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
          }`}
          title="No me gusta"
        >
          <ThumbsDown className={`w-4 h-4 ${reaction === 'dislike' ? 'fill-rose-400' : ''}`} />
        </button>
      </div>

      {/* Share and Bookmark Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Bookmark Button */}
        <button
          onClick={handleBookmarkToggle}
          disabled={toggleWatchlistMutation.isPending}
          aria-label={isSaved ? 'Quitar de favoritos' : 'Guardar en mi lista'}
          aria-pressed={isSaved}
          className={`flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl text-xs font-semibold transition-all border ${
            isSaved
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title={isSaved ? 'Guardado en favoritos' : 'Guardar en mi lista'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-indigo-400 text-indigo-400' : ''}`} />
          <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          aria-label="Copiar enlace del episodio"
          className={`flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl text-xs font-semibold transition-all border ${
            isCopied
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title="Copiar enlace del episodio"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">¡Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
