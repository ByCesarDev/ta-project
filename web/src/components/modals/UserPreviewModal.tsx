import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Loader2, UserX, Sparkles } from 'lucide-react';
import { useUserPreview } from '../../context/UserPreviewContext.js';
import { useViewerProfile } from '../../context/ViewerProfileContext.js';
import { usePublicProfile } from '../../hooks/usePublicProfile.js';
import { getAvatarUrl } from '../../lib/utils.js';

export const UserPreviewModal: React.FC = () => {
  const { isOpen, target, closePreview } = useUserPreview();
  const { activeProfile } = useViewerProfile();
  const navigate = useNavigate();

  const identifier = target?.profileId || target?.username || null;
  const { data: profile, isLoading, isError } = usePublicProfile(isOpen ? identifier : null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePreview();
    }
  };

  const handleViewFullProfile = () => {
    if (!profile) return;
    closePreview();

    // If viewing the current active viewer profile, go directly to /profile management
    if (activeProfile?.id === profile.id) {
      navigate('/profile');
    } else {
      navigate(`/u/${profile.username}`);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-preview-title"
    >
      <div className="w-full max-w-sm sm:max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl p-5 overflow-hidden relative">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <span
            id="user-preview-title"
            className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Perfil de Usuario
          </span>
          <button
            type="button"
            onClick={closePreview}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Cargando perfil...</span>
          </div>
        ) : isError || !profile ? (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Perfil no encontrado</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                El usuario solicitado no existe o fue eliminado de la comunidad.
              </p>
            </div>
            <button
              type="button"
              onClick={closePreview}
              className="mt-2 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Identity Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 shrink-0 shadow-inner">
                <img
                  src={getAvatarUrl(profile.avatar_url)}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white leading-tight truncate">
                  {profile.display_name}
                </h3>
                <p className="text-xs font-mono text-indigo-400 font-medium">
                  @{profile.username}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Miembro de TotalAnime
                  </span>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                {profile.bio && profile.bio.trim() ? (
                  profile.bio
                ) : (
                  <span className="text-slate-500 italic">
                    Este usuario aún no ha agregado una biografía.
                  </span>
                )}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-white">
                  {profile.stats.animes_watched}
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Animes vistos
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-white">
                  {profile.stats.episodes_watched}
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Episodios vistos
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleViewFullProfile}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
              >
                Ver perfil completo
              </button>

              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-400 text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80"
                title="Función próximamente disponible"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                <span>Agregar a amigos</span>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700/60 ml-1">
                  Próximamente
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
