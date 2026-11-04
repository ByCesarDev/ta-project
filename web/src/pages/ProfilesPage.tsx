import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useViewerProfile } from '../context/ViewerProfileContext.js';
import { getAvatarUrl } from '../lib/utils.js';
import { useAvatars } from '../hooks/useAvatars.js';
import { Plus, Check, Settings, ShieldAlert, Sparkles, Tv } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { ManageProfilesModal } from '../components/profiles/ManageProfilesModal.js';

export const ProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profiles,
    activeProfile,
    selectProfile,
    createProfile,
    openManageModal,
  } = useViewerProfile();

  const { data: avatarsList } = useAvatars();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [isUsernameTouched, setIsUsernameTouched] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!user) {
    return (
      <PageContainer>
        <div className="py-24 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Tv className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            Inicia sesión para ver tus perfiles
          </h2>
          <Button onClick={() => navigate('/login')}>Iniciar Sesión</Button>
        </div>
      </PageContainer>
    );
  }

  const handleSelect = (id: string) => {
    selectProfile(id);
    navigate('/');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Ingresa un nombre para el perfil.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const created = await createProfile({
        displayName: newName.trim(),
        username: newUsername.trim() || undefined,
        avatarUrl: selectedAvatar || null,
      });
      setIsCreating(false);
      setNewName('');
      setNewUsername('');
      setIsUsernameTouched(false);
      setSelectedAvatar('');
      handleSelect(created.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="py-12 sm:py-16 max-w-3xl mx-auto text-center animate-fade-in">
        {!isCreating ? (
          <>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TotalAnime Perfiles</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight">
                ¿Quién está viendo ahora?
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Selecciona tu perfil de espectador para continuar con tu historial y lista de animes.
              </p>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-center items-start mb-12">
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-2"
                  >
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-slate-900 border-2 transition-all duration-300 shadow-xl group-hover:shadow-indigo-500/25 group-hover:border-indigo-500 border-slate-800">
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
                        <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md text-[9px] font-bold text-slate-300 py-0.5 rounded text-center">
                          Principal
                        </div>
                      )}
                    </div>
                    <span className="text-base font-bold text-slate-300 group-hover:text-white mt-3 line-clamp-1 transition-colors">
                      {p.display_name || p.name}
                    </span>
                    {p.username && (
                      <span className="text-xs font-mono text-slate-500 group-hover:text-slate-400 line-clamp-1">
                        @{p.username}
                      </span>
                    )}
                  </button>
                );
              })}

              {profiles.length < 5 && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-2"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 border-dashed border-slate-700 group-hover:border-indigo-400 group-hover:bg-indigo-600/10 flex flex-col items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-all duration-300">
                    <Plus className="w-9 h-9" />
                  </div>
                  <span className="text-base font-bold text-slate-400 group-hover:text-indigo-300 mt-3 transition-colors">
                    Añadir Perfil
                  </span>
                </button>
              )}
            </div>

            {/* Manage profiles action */}
            <div className="flex justify-center">
              <button
                onClick={openManageModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer border border-slate-800 hover:border-slate-700"
              >
                <Settings className="w-4 h-4" />
                <span>Administrar perfiles</span>
              </button>
            </div>
          </>
        ) : (
          /* Create Mode */
          <div className="max-w-md mx-auto text-left rounded-3xl bg-[#0c101c] border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white font-['Outfit'] mb-1">
              Crear nuevo perfil
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Personaliza el nombre y elige un avatar para este espectador.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre visible
                </label>
                <input
                  type="text"
                  maxLength={40}
                  required
                  value={newName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewName(val);
                    if (!isUsernameTouched) {
                      setNewUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 25));
                    }
                  }}
                  placeholder="Ej. Nelis"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Usuario único (@handle)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">@</span>
                  <input
                    type="text"
                    maxLength={25}
                    value={newUsername}
                    onChange={(e) => {
                      setIsUsernameTouched(true);
                      setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    }}
                    placeholder="usuario"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Identificador público para comentarios y menciones (3 a 25 caracteres).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Selecciona un avatar de anime
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 rounded-xl bg-slate-900/50 border border-slate-800/60">
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

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Perfil'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ManageProfilesModal />
    </PageContainer>
  );
};

