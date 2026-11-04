import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useEpisodeReactions, useSetEpisodeReaction } from '../../hooks/useReactions.js';
import { useIsEpisodeSaved, useToggleSavedEpisode } from '../../hooks/useSavedEpisodes.js';

interface EpisodeReactionsProps {
  episodeId?: number;
  animeSlug: string;
  episodeNumber: number;
  episodeTitle?: string | null;
  animeTitle: string;
  seriesId?: number;
  animeId?: number;
  duration?: string | null;
  thumbnail?: string | null;
  variant?: 'inline' | 'default';
}

export const EpisodeReactions: React.FC<EpisodeReactionsProps> = ({
  episodeId,
  animeSlug,
  episodeNumber,
  episodeTitle,
  animeTitle,
  seriesId,
  animeId,
  duration,
  thumbnail,
  variant = 'default',
}) => {
  const { user } = useAuth();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 1. Global Likes & Dislikes from Turso
  const { data: reactionStats } = useEpisodeReactions(episodeId || 0);
  const setReactionMutation = useSetEpisodeReaction(episodeId || 0);
  const userReaction = reactionStats?.user_reaction;

  // 2. Saved Episode state
  const { data: isSaved } = useIsEpisodeSaved(episodeId);
  const toggleSaveMutation = useToggleSavedEpisode(episodeId || 0);

  const handleLike = () => {
    if (!user) {
      alert('Inicia sesión para votar en este episodio.');
      return;
    }
    setReactionMutation.mutate('like');
  };

  const handleDislike = () => {
    if (!user) {
      alert('Inicia sesión para votar en este episodio.');
      return;
    }
    setReactionMutation.mutate('dislike');
  };

  const handleBookmarkToggle = () => {
    if (!episodeId) return;
    toggleSaveMutation.mutate({
      seriesId,
      animeId,
      animeSlug,
      animeTitle,
      episodeNumber,
      episodeTitle,
      thumbnail,
      duration,
    });
  };

  const handleShare = async () => {
    try {
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

  const isInline = variant === 'inline';

  return (
    <div
      className={
        isInline
          ? 'flex items-center gap-2 flex-wrap py-1'
          : 'flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 rounded-2xl bg-[#0c101c] border border-slate-800/80 mb-6 shadow-lg'
      }
    >
      {/* Reactions Section (Likes & Dislikes) */}
      <div className="flex items-center gap-2">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={setReactionMutation.isPending}
          aria-label="Me gusta este episodio"
          aria-pressed={userReaction === 'like'}
          className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            userReaction === 'like'
              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title="Me gusta este episodio"
        >
          <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-indigo-400' : ''}`} />
          <span className="text-[11px] font-semibold">{reactionStats?.likes || 0}</span>
        </button>

        {/* Dislike Button */}
        <button
          onClick={handleDislike}
          disabled={setReactionMutation.isPending}
          aria-label="No me gusta"
          aria-pressed={userReaction === 'dislike'}
          className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            userReaction === 'dislike'
              ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 shadow-md shadow-rose-600/20'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
          }`}
          title="No me gusta"
        >
          <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-rose-400' : ''}`} />
          {(reactionStats?.dislikes || 0) > 0 && (
            <span className="text-[11px] font-semibold">{reactionStats?.dislikes}</span>
          )}
        </button>
      </div>

      {/* Share and Bookmark Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Save Episode Bookmark Button */}
        <button
          onClick={handleBookmarkToggle}
          disabled={toggleSaveMutation.isPending}
          className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            isSaved
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title={isSaved ? 'Guardado en tu lista de episodios' : 'Guardar este episodio'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span className="text-[11px] font-medium hidden sm:inline">
            {isSaved ? 'Guardado' : 'Guardar'}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            isCopied
              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title="Compartir enlace del episodio"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-medium hidden sm:inline text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="text-[11px] font-medium hidden sm:inline">Compartir</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
