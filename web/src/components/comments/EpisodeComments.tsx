import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Reply,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Send,
  LogIn,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useViewerProfile } from '../../context/ViewerProfileContext.js';
import { getAvatarUrl } from '../../lib/utils.js';
import {
  useEpisodeComments,
  useCreateComment,
  useToggleCommentLike,
  useDeleteComment,
  CommentItem,
} from '../../hooks/useComments.js';

interface EpisodeCommentsProps {
  episodeId: number;
}

function renderCommentContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_\-\.]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      return (
        <span key={idx} className="text-indigo-400 font-semibold bg-indigo-500/10 px-1 py-0.5 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
}

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `hace ${months}m`;
    return `hace ${Math.floor(months / 12)}a`;
  } catch {
    return 'hace poco';
  }
}

export const EpisodeComments: React.FC<EpisodeCommentsProps> = ({ episodeId }) => {
  const { user, profile, role } = useAuth();
  const { activeProfile } = useViewerProfile();

  const activeAvatar = activeProfile?.avatar_url || profile?.avatar_url;
  const activeName = activeProfile?.display_name || activeProfile?.name || profile?.username || 'Usuario';
  const activeUsername = activeProfile?.username || profile?.username || 'usuario';

  const { data, isLoading, error } = useEpisodeComments(episodeId);

  const createMutation = useCreateComment(episodeId);
  const likeMutation = useToggleCommentLike(episodeId);
  const deleteMutation = useDeleteComment(episodeId);

  // New root comment form state
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyIsSpoiler, setReplyIsSpoiler] = useState(false);

  // Revelead spoilers (ids set)
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  const toggleRevealSpoiler = (id: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePostRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || createMutation.isPending) return;

    try {
      await createMutation.mutateAsync({
        content: content.trim(),
        isSpoiler,
      });
      setContent('');
      setIsSpoiler(false);
    } catch (err: any) {
      alert(err.message || 'Error al publicar comentario');
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyContent.trim() || createMutation.isPending) return;

    try {
      await createMutation.mutateAsync({
        content: replyContent.trim(),
        isSpoiler: replyIsSpoiler,
        parentId,
      });
      setReplyingToId(null);
      setReplyContent('');
      setReplyIsSpoiler(false);
    } catch (err: any) {
      alert(err.message || 'Error al enviar respuesta');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este comentario?')) return;
    try {
      await deleteMutation.mutateAsync(commentId);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const comments = data?.comments || [];

  return (
    <div className="w-full space-y-6">
      {/* 1. Comment Creation Form (or Login CTA) */}
      {user ? (
        <form onSubmit={handlePostRootComment} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              <img
                src={getAvatarUrl(activeAvatar)}
                alt={activeName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  activeProfile
                    ? `Comentar como ${activeName} (@${activeUsername})...`
                    : `Comentar como ${activeName}...`
                }
                rows={2}
                maxLength={2000}
                className="w-full rounded-xl bg-[#090d16] border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 p-3 text-sm text-slate-200 placeholder-slate-500 resize-none outline-none transition-all"
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Spoiler checkbox */}
                <button
                  type="button"
                  onClick={() => setIsSpoiler((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSpoiler
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {isSpoiler ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isSpoiler ? 'Contiene Spoiler' : 'Marcar como spoiler'}</span>
                </button>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!content.trim() || createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Comentar</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">Únete a la conversación</p>
              <p className="text-[11px] text-slate-400">
                Inicia sesión con tu cuenta de TotalAnime para comentar y votar.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all shrink-0"
          >
            Iniciar sesión
          </Link>
        </div>
      )}

      {/* 2. Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs">Cargando comentarios...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-rose-400">
            No se pudieron cargar los comentarios. Reintenta más tarde.
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
            <p className="text-xs">Aún no hay comentarios en este episodio.</p>
            <p className="text-[11px] text-slate-600">¡Sé el primero en compartir tu opinión!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUser={user}
              userRole={role}
              isSpoilerRevealed={revealedSpoilers.has(comment.id)}
              onToggleReveal={() => toggleRevealSpoiler(comment.id)}
              onLike={(targetId) => likeMutation.mutate(targetId)}
              onDelete={(targetId) => handleDelete(targetId)}
              isLiking={likeMutation.isPending}
              replyingToId={replyingToId}
              onStartReply={(mention) => {
                setReplyingToId(comment.id);
                setReplyContent(mention || '');
                setReplyIsSpoiler(false);
              }}
              onCancelReply={() => setReplyingToId(null)}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              replyIsSpoiler={replyIsSpoiler}
              setReplyIsSpoiler={setReplyIsSpoiler}
              onSubmitReply={() => handlePostReply(comment.id)}
              isSubmittingReply={createMutation.isPending}
              revealedSpoilers={revealedSpoilers}
              toggleRevealSpoiler={toggleRevealSpoiler}
              activeName={activeName}
              activeUsername={activeUsername}
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Individual Comment Item with Threaded Replies
 */
interface CommentCardProps {
  comment: CommentItem;
  currentUser: any;
  userRole: string;
  isSpoilerRevealed: boolean;
  onToggleReveal: () => void;
  onLike: (targetId: string) => void;
  onDelete: (targetId: string) => void;
  isLiking: boolean;
  replyingToId: string | null;
  onStartReply: (initialMention?: string) => void;
  onCancelReply: () => void;
  replyContent: string;
  setReplyContent: (val: string) => void;
  replyIsSpoiler: boolean;
  setReplyIsSpoiler: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmitReply: () => void;
  isSubmittingReply: boolean;
  revealedSpoilers: Set<string>;
  toggleRevealSpoiler: (id: string) => void;
  activeName?: string;
  activeUsername?: string;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUser,
  userRole,
  isSpoilerRevealed,
  onToggleReveal,
  onLike,
  onDelete,
  replyingToId,
  onStartReply,
  onCancelReply,
  replyContent,
  setReplyContent,
  replyIsSpoiler,
  setReplyIsSpoiler,
  onSubmitReply,
  isSubmittingReply,
  revealedSpoilers,
  toggleRevealSpoiler,
  activeName,
  activeUsername,
}) => {
  const isOwner = currentUser?.id === comment.user_id;
  const canDelete = isOwner || userRole === 'admin';
  const isReplying = replyingToId === comment.id;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3 transition-all hover:border-slate-700/60">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
            <img
              src={getAvatarUrl(comment.avatar_url)}
              alt={comment.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white">{comment.display_name || comment.username}</span>
              <span className="text-[11px] font-mono text-slate-400">@{comment.username}</span>
              {comment.user_role === 'admin' && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">{formatRelativeTime(comment.created_at)}</span>
          </div>
        </div>

        {canDelete && !comment.is_deleted && (
          <button
            onClick={() => onDelete(comment.id)}
            title="Eliminar comentario"
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Comment Body / Spoiler */}
      {comment.is_spoiler && !isSpoilerRevealed ? (
        <div
          onClick={onToggleReveal}
          className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 hover:border-amber-700/50 cursor-pointer flex items-center justify-between text-amber-300 text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Este comentario contiene spoilers. Haz clic para revelarlo.</span>
          </div>
          <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />
        </div>
      ) : (
        <div className="relative">
          <p
            className={`text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed ${
              comment.is_deleted ? 'italic text-slate-500' : ''
            }`}
          >
            {renderCommentContent(comment.content)}
          </p>
          {comment.is_spoiler && (
            <button
              onClick={onToggleReveal}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 mt-1 flex items-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3 h-3" /> Ocultar spoiler
            </button>
          )}
        </div>
      )}

      {/* Actions Row */}
      {!comment.is_deleted && (
        <div className="flex items-center gap-4 pt-1 border-t border-slate-800/40 text-xs">
          <button
            onClick={() => onLike(comment.id)}
            disabled={!currentUser}
            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              comment.is_liked_by_me
                ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${comment.is_liked_by_me ? 'fill-rose-400' : ''}`} />
            <span className="font-medium text-xs">{comment.likes_count || 0}</span>
          </button>

          {currentUser && (
            <button
              onClick={() => {
                if (isReplying) {
                  onCancelReply();
                } else {
                  onStartReply(`@${comment.username} `);
                }
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 py-1 px-2 rounded-lg hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>{isReplying ? 'Cancelar' : 'Responder'}</span>
            </button>
          )}
        </div>
      )}

      {/* Inline Reply Box */}
      {isReplying && (
        <div className="pt-2 pl-4 sm:pl-6 border-l-2 border-indigo-500/40 space-y-2 mt-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Responder a @${comment.username} como ${activeName || 'ti'}${activeUsername ? ` (@${activeUsername})` : ''}...`}
            rows={2}
            className="w-full rounded-xl bg-[#090d16] border border-slate-800 focus:border-indigo-500 p-2.5 text-xs text-slate-200 placeholder-slate-500 resize-none outline-none"
            autoFocus
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReplyIsSpoiler((prev) => !prev)}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded cursor-pointer ${
                replyIsSpoiler ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {replyIsSpoiler ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
              <span>{replyIsSpoiler ? 'Con Spoiler' : 'Spoiler'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancelReply}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-300 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!replyContent.trim() || isSubmittingReply}
                onClick={onSubmitReply}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                {isSubmittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Responder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-3 sm:pl-6 border-l border-slate-800 space-y-3 pt-2 mt-2">
          {comment.replies.map((reply) => {
            const isReplyOwner = currentUser?.id === reply.user_id;
            const canDeleteReply = isReplyOwner || userRole === 'admin';

            return (
              <div key={reply.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      <img
                        src={getAvatarUrl(reply.avatar_url)}
                        alt={reply.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{reply.display_name || reply.username}</span>
                        <span className="text-[10px] font-mono text-slate-400">@{reply.username}</span>
                        {reply.user_role === 'admin' && (
                          <span className="flex items-center gap-0.5 px-1 py-0.1 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[8px] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500">{formatRelativeTime(reply.created_at)}</span>
                    </div>
                  </div>

                  {canDeleteReply && !reply.is_deleted && (
                    <button
                      onClick={() => onDelete(reply.id)}
                      title="Eliminar respuesta"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {reply.is_spoiler && !revealedSpoilers.has(reply.id) ? (
                  <div
                    onClick={() => toggleRevealSpoiler(reply.id)}
                    className="p-2 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-300 text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Contiene spoilers (Clic para ver)</span>
                    </span>
                    <Eye className="w-3 h-3 text-amber-400" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {renderCommentContent(reply.content)}
                  </p>
                )}

                {/* Reply Action Bar (Like & Responder) */}
                {!reply.is_deleted && (
                  <div className="flex items-center gap-3 pt-1 text-xs border-t border-slate-800/30">
                    <button
                      type="button"
                      onClick={() => onLike(reply.id)}
                      disabled={!currentUser}
                      className={`flex items-center gap-1 py-0.5 px-1.5 rounded transition-colors cursor-pointer ${
                        reply.is_liked_by_me
                          ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${reply.is_liked_by_me ? 'fill-rose-400' : ''}`} />
                      <span className="font-medium text-[11px]">{reply.likes_count || 0}</span>
                    </button>

                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => onStartReply(`@${reply.username} `)}
                        className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 py-0.5 px-1.5 rounded hover:bg-slate-800/40 transition-colors cursor-pointer text-[11px]"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Responder</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
