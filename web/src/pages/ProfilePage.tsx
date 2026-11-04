import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useViewerProfile } from '../context/ViewerProfileContext.js';
import { useWatchHistory } from '../hooks/useWatchHistory.js';
import { useWatchlist } from '../hooks/useWatchlist.js';
import { useSavedEpisodes } from '../hooks/useSavedEpisodes.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/common/Button.js';
import { AvatarSelectModal } from '../components/profile/AvatarSelectModal.js';
import { getAvatarUrl } from '../lib/utils.js';
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Tv,
  Film,
  Bookmark,
  Calendar,
  History,
  ArrowRight,
  Settings,
  Edit3,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { activeProfile, updateProfile, openManageModal, isLoading: isProfileLoading } = useViewerProfile();

  // Data queries for stats (isolated by active viewer profile)
  const { data: history = [], isLoading: isHistoryLoading } = useWatchHistory();
  const { data: watchlist = [], isLoading: isWatchlistLoading } = useWatchlist();
  const { data: savedEpisodes = [], isLoading: isSavedLoading } = useSavedEpisodes();

  // Form states for active viewer profile
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when activeProfile loads or switches
  useEffect(() => {
    if (activeProfile) {
      setDisplayName(activeProfile.display_name || activeProfile.name || '');
      setUsername(activeProfile.username || '');
      setBio(activeProfile.bio || '');
    }
  }, [activeProfile]);

  if (isAuthLoading || isProfileLoading) {
    return (
      <PageContainer>
        <div className="py-24 text-center text-xs text-slate-400">Cargando perfil público...</div>
      </PageContainer>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Calculate activity statistics
  const episodesCount = history.length;
  const animesCount = new Set(
    history
      .map((h: any) => h.episode?.anime?.id || h.episode?.anime?.slug || h.episodes?.animes?.id)
      .filter(Boolean)
  ).size;
  const favoritesCount = watchlist.length + savedEpisodes.length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    if (!displayName.trim()) {
      setErrorMsg('El nombre visible no puede estar vacío.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateProfile(activeProfile.id, {
        displayName: displayName.trim(),
        username: username.trim() || undefined,
        bio: bio.trim() || null,
        avatar_url: activeProfile.avatar_url,
      });

      setSuccessToast('Perfil actualizado con éxito');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (filename: string) => {
    if (!activeProfile) return;
    setErrorMsg(null);
    try {
      await updateProfile(activeProfile.id, {
        displayName: displayName.trim() || activeProfile.display_name,
        username: username.trim() || activeProfile.username,
        bio: bio.trim() || activeProfile.bio,
        avatar_url: filename,
      });
      setSuccessToast('Avatar del perfil actualizado');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar avatar');
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Perfil activo
              </span>
              <span className="text-xs font-mono text-slate-500">/profile</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
              Perfil Público
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Esta es tu identidad visible en TotalAnime para comentar, reaccionar y reproducir series.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openManageModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Cambiar Perfil</span>
            </button>
            <Link
              to="/settings/account"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
            >
              <span>Ajustes de Cuenta</span>
            </Link>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Profile Info Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0c101c] border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Clickable Profile Avatar */}
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="group relative w-28 h-28 rounded-3xl overflow-hidden bg-slate-900 border-2 border-indigo-500/60 shadow-xl cursor-pointer hover:border-indigo-400 hover:scale-105 transition-all shrink-0"
              title="Cambiar avatar del perfil"
            >
              <img
                src={getAvatarUrl(activeProfile?.avatar_url)}
                alt={displayName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                <Camera className="w-5 h-5 text-indigo-300" />
                <span>Cambiar</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-2xl font-black text-white font-['Outfit']">
                  {displayName || 'Espectador'}
                </h2>
                {activeProfile?.username && (
                  <span className="text-sm font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 w-fit mx-auto sm:mx-0">
                    @{activeProfile.username}
                  </span>
                )}
                {activeProfile?.is_default && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 w-fit mx-auto sm:mx-0">
                    Principal
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">
                {activeProfile?.bio ? (
                  <span className="text-slate-300 italic">"{activeProfile.bio}"</span>
                ) : (
                  <span>Miembro de TotalAnime. Sin biografía aún.</span>
                )}
              </p>

              <div className="pt-1 flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Perfil creado en {activeProfile?.created_at ? new Date(activeProfile.created_at).toLocaleDateString() : '2026'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad Stats Cards */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Actividad de este perfil
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {/* Stat: Animes */}
            <div className="p-4 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800 text-center space-y-1 shadow-lg hover:border-indigo-500/40 transition-colors">
              <div className="text-2xl sm:text-4xl font-black text-white font-['Outfit']">
                {isHistoryLoading ? '...' : animesCount}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-400 flex items-center justify-center gap-1.5">
                <Film className="w-4 h-4 text-indigo-400 hidden sm:inline" />
                <span>Animes</span>
              </div>
            </div>

            {/* Stat: Episodios */}
            <div className="p-4 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800 text-center space-y-1 shadow-lg hover:border-violet-500/40 transition-colors">
              <div className="text-2xl sm:text-4xl font-black text-white font-['Outfit']">
                {isHistoryLoading ? '...' : episodesCount}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-400 flex items-center justify-center gap-1.5">
                <Tv className="w-4 h-4 text-violet-400 hidden sm:inline" />
                <span>Episodios</span>
              </div>
            </div>

            {/* Stat: Favoritos */}
            <div className="p-4 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800 text-center space-y-1 shadow-lg hover:border-pink-500/40 transition-colors">
              <div className="text-2xl sm:text-4xl font-black text-white font-['Outfit']">
                {isWatchlistLoading || isSavedLoading ? '...' : favoritesCount}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-400 flex items-center justify-center gap-1.5">
                <Bookmark className="w-4 h-4 text-pink-400 hidden sm:inline" />
                <span>Favoritos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form: Información Pública */}
        <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl bg-[#0c101c] border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Editar Información Pública
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Los cambios se reflejan en tus comentarios y menciones comunitarias.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Cambiar Avatar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nombre visible
              </label>
              <input
                type="text"
                maxLength={40}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Nelis"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tu nombre amigable en títulos y listas.
              </p>
            </div>

            {/* Username Handle */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nombre de usuario (@handle)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">@</span>
                <input
                  type="text"
                  maxLength={25}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="usuario"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Identificador único para menciones y comentarios (3 a 25 caracteres).
              </p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Biografía del perfil
            </label>
            <textarea
              maxLength={250}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a la comunidad cuáles son tus animes o géneros favoritos..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>Máximo 250 caracteres</span>
              <span>{bio.length}/250</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando cambios...' : 'Guardar cambios del perfil'}
            </Button>
          </div>
        </form>

        {/* Quick Links to Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/watchlist"
            className="p-5 rounded-2xl bg-[#0c101c] border border-slate-800 hover:border-indigo-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-['Outfit']">Favoritos de este perfil</h4>
                <p className="text-[11px] text-slate-400">Ver series y episodios guardados ({favoritesCount})</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </Link>

          <Link
            to="/history"
            className="p-5 rounded-2xl bg-[#0c101c] border border-slate-800 hover:border-violet-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-['Outfit']">Historial de este perfil</h4>
                <p className="text-[11px] text-slate-400">Ver episodios reproducidos ({episodesCount})</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelectModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={activeProfile?.avatar_url}
        onSelectAvatar={handleAvatarSelect}
      />
    </PageContainer>
  );
};
