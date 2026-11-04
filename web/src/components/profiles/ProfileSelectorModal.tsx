import React, { useState } from 'react';
import { useViewerProfile } from '../../context/ViewerProfileContext.js';
import { getAvatarUrl } from '../../lib/utils.js';
import { useAvatars } from '../../hooks/useAvatars.js';
import { Plus, Check, Settings, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '../common/Button.js';

export const ProfileSelectorModal: React.FC = () => {
  const {
    profiles,
    activeProfile,
    isSelectorModalOpen,
    closeSelectorModal,
    selectProfile,
    createProfile,
    openManageModal,
  } = useViewerProfile();

  const { data: avatarsList } = useAvatars();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isSelectorModalOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Por favor ingresa un nombre para el perfil.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const created = await createProfile(newName.trim(), selectedAvatar || null);
      setIsCreating(false);
      setNewName('');
      setSelectedAvatar('');
      // Auto-select the newly created profile
      selectProfile(created.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0c101c] border border-slate-800 shadow-2xl p-6 sm:p-8 text-center">
        {/* Close button (only visible if an active profile is already selected) */}
        {activeProfile && (
          <button
            onClick={closeSelectorModal}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!isCreating ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Perfiles de Reproducción</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
                ¿Quién está viendo ahora?
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                Selecciona tu perfil para cargar tu historial, lista de favoritos y recomendaciones independientes.
              </p>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-center items-start mb-8">
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProfile(p.id)}
                    className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1.5"
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all duration-300 shadow-lg group-hover:shadow-indigo-500/25 group-hover:border-indigo-500 border-slate-800">
                      <img
                        src={getAvatarUrl(p.avatar_url)}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isActive && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      {p.is_default && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-sm text-[9px] font-bold text-slate-300 py-0.5 rounded text-center">
                          Principal
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white mt-2.5 line-clamp-1 transition-colors">
                      {p.name}
                    </span>
                  </button>
                );
              })}

              {/* Add Profile Button (if under 5) */}
              {profiles.length < 5 && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1.5"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-700 group-hover:border-indigo-400 group-hover:bg-indigo-600/10 flex flex-col items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-all duration-300">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-300 mt-2.5 transition-colors">
                    Añadir Perfil
                  </span>
                </button>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  closeSelectorModal();
                  openManageModal();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Administrar perfiles</span>
              </button>
            </div>
          </>
        ) : (
          /* Create Profile View */
          <form onSubmit={handleCreate} className="text-left space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Crear nuevo perfil
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Añade un perfil para otra persona o para personalizar tus gustos.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nombre del perfil
              </label>
              <input
                type="text"
                maxLength={40}
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Nelis, GokuFan, Invitado..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Elige un avatar
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 rounded-xl bg-slate-900/50 border border-slate-800/60">
                {avatarsList?.map((av) => {
                  const isSelected = selectedAvatar === av.filename;
                  return (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.filename)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 scale-95 ring-2 ring-indigo-500/40'
                          : 'border-transparent hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={getAvatarUrl(av.filename)}
                        alt={av.filename}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setErrorMsg(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Perfil'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
