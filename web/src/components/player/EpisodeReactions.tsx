import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Check } from 'lucide-react';

interface EpisodeReactionsProps {
  animeSlug: string;
  episodeNumber: number;
  animeTitle: string;
  initialLikes?: number;
}

export const EpisodeReactions: React.FC<EpisodeReactionsProps> = ({
  animeSlug,
  episodeNumber,
  animeTitle,
  initialLikes = 142,
}) => {
  const storageKey = `ta_reaction_${animeSlug}_ep_${episodeNumber}`;
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  const [likeCount, setLikeCount] = useState<number>(initialLikes);
  const [dislikeCount, setDislikeCount] = useState<number>(6);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    return localStorage.getItem(`ta_saved_${animeSlug}`) === 'true';
  });

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
      // Toggle off
      setReaction(null);
      setLikeCount((c) => Math.max(0, c - 1));
      localStorage.removeItem(storageKey);
    } else {
      // Toggle on
      if (reaction === 'dislike') {
        setDislikeCount((c) => Math.max(0, c - 1));
      }
      setReaction('like');
      setLikeCount((c) => c + 1);
      localStorage.setItem(storageKey, 'like');
    }
  };

  const handleDislike = () => {
    if (reaction === 'dislike') {
      // Toggle off
      setReaction(null);
      setDislikeCount((c) => Math.max(0, c - 1));
      localStorage.removeItem(storageKey);
    } else {
      // Toggle on
      if (reaction === 'like') {
        setLikeCount((c) => Math.max(0, c - 1));
      }
      setReaction('dislike');
      setDislikeCount((c) => c + 1);
      localStorage.setItem(storageKey, 'dislike');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: `${animeTitle} - Episodio ${episodeNumber}`,
            url: shareUrl,
          });
        } catch {
          // Ignore cancel
        }
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      localStorage.setItem(`ta_saved_${animeSlug}`, String(next));
      return next;
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 rounded-2xl bg-[#0c101c] border border-slate-800/80 mb-8 shadow-lg">
      {/* Reactions Section */}
      <div className="flex items-center gap-2">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            reaction === 'like'
              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-md shadow-indigo-600/20 scale-105'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title="Me gusta este episodio"
        >
          <ThumbsUp className={`w-4 h-4 ${reaction === 'like' ? 'fill-indigo-400' : ''}`} />
          <span>{likeCount}</span>
        </button>

        {/* Dislike Button */}
        <button
          onClick={handleDislike}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            reaction === 'dislike'
              ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 shadow-md shadow-rose-600/20 scale-105'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
          }`}
          title="No me gusta"
        >
          <ThumbsDown className={`w-4 h-4 ${reaction === 'dislike' ? 'fill-rose-400' : ''}`} />
          <span>{dislikeCount}</span>
        </button>
      </div>

      {/* Share and Bookmark Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Bookmark Button */}
        <button
          onClick={handleBookmarkToggle}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            isBookmarked
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title={isBookmarked ? 'Guardado en favoritos' : 'Guardar en mi lista'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          <span className="hidden sm:inline">{isBookmarked ? 'Guardado' : 'Guardar'}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
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
              <span className="hidden sm:inline">Compartir</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
