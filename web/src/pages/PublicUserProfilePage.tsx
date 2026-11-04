import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Sparkles, Tv, Film, Calendar, Edit3, Loader2, UserX } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { usePublicProfile } from '../hooks/usePublicProfile.js';
import { useViewerProfile } from '../context/ViewerProfileContext.js';
import { getAvatarUrl } from '../lib/utils.js';

export const PublicUserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { activeProfile } = useViewerProfile();

  const { data: profile, isLoading, isError } = usePublicProfile(username);

  const isOwner = activeProfile && profile && activeProfile.id === profile.id;

  const formattedDate = React.useMemo(() => {
    if (!profile?.created_at) return null;
    try {
      const d = new Date(profile.created_at);
      return new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return null;
    }
  }, [profile?.created_at]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400">Cargando perfil público...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <div className="py-20 max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <UserX className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Perfil no encontrado</h1>
            <p className="text-xs text-slate-400 mt-1.5">
              El usuario <span className="font-mono text-indigo-400">@{username}</span> no existe o no se encuentra disponible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-8 max-w-3xl mx-auto space-y-6">
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          {isOwner && (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar mi perfil</span>
            </Link>
          )}
        </div>

        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#070b14]/90 p-6 sm:p-8 backdrop-blur-md">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700/80 shrink-0 shadow-xl">
              <img
                src={getAvatarUrl(profile.avatar_url)}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {profile.display_name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Miembro de TotalAnime
                </span>
              </div>

              <p className="text-sm font-mono text-indigo-400 font-medium">
                @{profile.username}
              </p>

              {formattedDate && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Miembro desde {formattedDate}</span>
                </p>
              )}
            </div>

            {/* Friend action placeholder */}
            {!isOwner && (
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80"
                  title="Función próximamente disponible"
                >
                  <UserPlus className="w-4 h-4 text-slate-400" />
                  <span>Agregar a amigos</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700/60 ml-1">
                    Próximamente
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Bio Block */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Biografía
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
              {profile.bio && profile.bio.trim() ? (
                profile.bio
              ) : (
                <span className="text-slate-500 italic">
                  Este usuario aún no ha agregado una biografía.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {profile.stats.animes_watched}
              </div>
              <div className="text-xs font-medium text-slate-400">
                Animes vistos
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {profile.stats.episodes_watched}
              </div>
              <div className="text-xs font-medium text-slate-400">
                Episodios vistos
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
