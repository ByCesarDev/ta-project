import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useViewerProfile, ViewerProfile } from '../../context/ViewerProfileContext.js';
import { getAvatarUrl } from '../../lib/utils.js';
import { useAvatars } from '../../hooks/useAvatars.js';
import { Edit2, Trash2, X, Check, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button.js';

export const ManageProfilesModal: React.FC = () => {
  const {
    profiles,
    isManageModalOpen,
    closeManageModal,
    openSelectorModal,
    updateProfile,
    deleteProfile,
  } = useViewerProfile();

  const { data: avatarsList } = useAvatars();

  const [editingProfile, setEditingProfile] = useState<ViewerProfile | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isManageModalOpen) return null;

  const startEdit = (p: ViewerProfile) => {
    setEditingProfile(p);
    setEditName(p.display_name || p.name);
    setEditUsername(p.username || '');
    setEditAvatar(p.avatar_url || '');
    setErrorMsg(null);
    setIsAvatarPickerOpen(false);
  };

  const cancelEdit = () => {
    setEditingProfile(null);
    setErrorMsg(null);
    setIsAvatarPickerOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    if (!editName.trim()) {
      setErrorMsg('El nombre no puede estar vacío.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await updateProfile(editingProfile.id, {
        displayName: editName.trim(),
        name: editName.trim(),
        username: editUsername.trim() || undefined,
        avatar_url: editAvatar || null,
      });
      cancelEdit();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProfile) return;
    if (editingProfile.is_default) {
      alert('No puedes eliminar el perfil principal de tu cuenta.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el perfil "${editingProfile.name}"? Se perderán sus favoritos e historial.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteProfile(editingProfile.id);
      cancelEdit();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el perfil');
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          closeManageModal();
          openSelectorModal();
        }}
      />
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0c101c] border border-slate-800 shadow-2xl p-6 sm:p-8 my-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            closeManageModal();
            openSelectorModal();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!editingProfile ? (
          /* List Mode */
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mb-2">
              Administrar perfiles
            </h2>
            <p className="text-xs text-slate-400 mb-8">
              Selecciona cualquier perfil para cambiar su nombre o avatar.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-center items-start mb-8">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startEdit(p)}
                  className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1.5"
                >
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 group-hover:border-indigo-500 transition-all shadow-lg">
                    <img
                      src={getAvatarUrl(p.avatar_url)}
                      alt={p.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center shadow">
                        <Edit2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white mt-2.5 line-clamp-1 transition-colors">
                    {p.display_name || p.name}
                  </span>
                  {p.username && (
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-400 line-clamp-1">
                      @{p.username}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-center">
              <Button
                onClick={() => {
                  closeManageModal();
                  openSelectorModal();
                }}
              >
                Listo
              </Button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Editar perfil
                </h3>
                <p className="text-xs text-slate-400">
                  {editingProfile.is_default ? 'Perfil principal de tu cuenta' : 'Perfil secundario'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Preview & Picker Trigger */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500 shadow-xl">
                  <img
                    src={getAvatarUrl(editAvatar)}
                    alt={editName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen((prev) => !prev)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors underline cursor-pointer"
                >
                  {isAvatarPickerOpen ? 'Ocultar avatares' : 'Cambiar avatar'}
                </button>
              </div>

              {/* Name & Username Inputs */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Nombre visible
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="usuario"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Solo minúsculas, números y guiones bajos (3-25 caracteres). Se usa en comentarios y menciones.
                  </p>
                </div>
              </div>
            </div>

            {/* Collapsible Avatar Picker */}
            {isAvatarPickerOpen && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Elige un nuevo avatar de anime
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 rounded-xl bg-slate-900/50 border border-slate-800/60">
                  {avatarsList?.map((av) => {
                    const isSelected = editAvatar === av.filename;
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setEditAvatar(av.filename)}
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
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              {!editingProfile.is_default ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Eliminando...' : 'Eliminar perfil'}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

