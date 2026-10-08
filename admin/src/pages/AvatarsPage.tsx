import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle,
  Trash2,
  Star,
  Search,
  AlertCircle,
  X,
  Sparkles,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAvatars } from '../hooks/useAvatars.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { getAvatarUrl, formatDate } from '../lib/utils.js';
import { AvatarItem } from '../types/index.js';

export const AvatarsPage: React.FC = () => {
  const {
    avatars,
    isLoading,
    uploadAvatars,
    isUploading,
    setDefaultAvatar,
    isSettingDefault,
    deleteAvatar,
    isDeleting,
  } = useAvatars();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarToDelete, setAvatarToDelete] = useState<AvatarItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle selected files
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) {
          validFiles.push(file);
          validPreviews.push(URL.createObjectURL(file));
        } else {
          setStatusMessage({
            type: 'error',
            text: `El archivo ${file.name} supera el límite de 5MB.`,
          });
        }
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...validPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setStatusMessage(null);

    try {
      const res = await uploadAvatars(selectedFiles);
      // Clean up object URLs
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setFilePreviews([]);
      setStatusMessage({
        type: 'success',
        text: res.message || `${res.avatars?.length || selectedFiles.length} avatar(es) subido(s) exitosamente.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error al subir avatares',
      });
    }
  };

  const handleSetDefault = async (avatar: AvatarItem) => {
    if (avatar.is_default) return;
    setStatusMessage(null);
    try {
      await setDefaultAvatar(avatar.id);
      setStatusMessage({
        type: 'success',
        text: `"${avatar.filename}" ahora es el avatar predeterminado del sistema.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error al establecer avatar predeterminado',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!avatarToDelete) return;
    setStatusMessage(null);
    try {
      await deleteAvatar(avatarToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `Avatar "${avatarToDelete.filename}" eliminado exitosamente.`,
      });
      setAvatarToDelete(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error al eliminar avatar',
      });
      setAvatarToDelete(null);
    }
  };

  const filteredAvatars = avatars.filter((av) =>
    av.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultAvatar = avatars.find((av) => av.is_default);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#0d1322] to-slate-900 border border-slate-800/80 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
              Gestión de Avatares
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sube y administra los avatares disponibles para los usuarios de TotalAnime. Todas las imágenes son
            servidas con un proxy de privacidad (<code className="text-indigo-300">/api/v1/avatars/:filename</code>)
            ocultando el origen directo de Supabase Storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Avatares</span>
            <span className="text-lg font-black text-white font-mono">{avatars.length}</span>
          </div>
          {defaultAvatar && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <img
                src={getAvatarUrl(defaultAvatar.filename)}
                alt="Predeterminado"
                className="w-8 h-8 rounded-xl object-cover border border-indigo-400/40"
              />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">Por Defecto</span>
                <span className="text-xs font-bold text-white truncate max-w-[100px] block">{defaultAvatar.filename}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-medium animate-in slide-in-from-top duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Multi-upload Dropzone */}
      <div className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          Subir Nuevos Avatares
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Haz clic o arrastra múltiples imágenes aquí
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Formatos soportados: PNG, JPG, WEBP, GIF (máximo 5MB por archivo)
              </p>
            </div>
          </div>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {selectedFiles.length} imagen(es) seleccionada(s)
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUploadSubmit}
                isLoading={isUploading}
                icon={<UploadCloud className="w-4 h-4" />}
              >
                Subir Todos a la BD & Storage
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl bg-slate-900 border border-slate-800 p-2.5 flex flex-col items-center gap-2"
                >
                  <img
                    src={filePreviews[idx]}
                    alt={file.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700/80"
                  />
                  <div className="w-full text-center">
                    <p className="text-[11px] font-medium text-slate-300 truncate w-full" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedFile(idx);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                    title="Quitar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatars Management Grid */}
      <div className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Galería de Avatares Registrados ({filteredAvatars.length})
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
            <p className="text-xs">Cargando avatares...</p>
          </div>
        ) : filteredAvatars.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No se encontraron avatares que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAvatars.map((avatar) => (
              <div
                key={avatar.id}
                className={`relative rounded-2xl p-3 border transition-all duration-200 flex flex-col items-center text-center group ${
                  avatar.is_default
                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Avatar Preview */}
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden mb-2.5 border border-slate-700/60 bg-slate-950 group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={getAvatarUrl(avatar.filename)}
                    alt={avatar.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {avatar.is_default && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="w-full mb-3 space-y-0.5">
                  <p className="text-xs font-bold text-slate-200 truncate w-full" title={avatar.filename}>
                    {avatar.filename}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    ID #{avatar.id} • {avatar.created_at ? formatDate(avatar.created_at) : 'Base'}
                  </p>
                </div>

                {/* Badge status */}
                <div className="mb-3">
                  {avatar.is_default ? (
                    <Badge variant="purple" size="sm">
                      Predeterminado
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-slate-500">Avatar Opcional</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="w-full flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(avatar)}
                    disabled={avatar.is_default || isSettingDefault}
                    className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                      avatar.is_default
                        ? 'bg-indigo-500/10 text-indigo-400 cursor-default opacity-80'
                        : 'bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40'
                    }`}
                    title={avatar.is_default ? 'Ya es el predeterminado' : 'Hacer predeterminado'}
                  >
                    <Star className="w-3 h-3" />
                    <span>Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarToDelete(avatar)}
                    disabled={avatar.is_default}
                    className={`p-1.5 rounded-xl text-slate-400 transition-all ${
                      avatar.is_default
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30'
                    }`}
                    title={avatar.is_default ? 'No se puede eliminar el avatar default' : 'Eliminar avatar'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(avatarToDelete)}
        onClose={() => setAvatarToDelete(null)}
        title="Confirmar Eliminación de Avatar"
      >
        <div className="space-y-4 py-2 text-xs">
          <p className="text-slate-300">
            ¿Estás seguro de que deseas eliminar permanentemente el avatar{' '}
            <strong className="text-white font-mono">{avatarToDelete?.filename}</strong>?
          </p>
          <p className="text-slate-400">
            Esta acción borrará el archivo físico del bucket de Supabase Storage y su registro en la base de datos.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setAvatarToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
