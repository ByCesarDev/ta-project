import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import { useAvatars } from '../../hooks/useAvatars.js';
import { Button } from '../common/Button.js';
import { getAvatarUrl } from '../../lib/utils.js';

interface AvatarSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onSelectAvatar: (filename: string) => Promise<void>;
}

export const AvatarSelectModal: React.FC<AvatarSelectModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
}) => {
  const { data: avatars, isLoading, isError } = useAvatars();
  const [selectedFilename, setSelectedFilename] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize selected filename based on current profile
  useEffect(() => {
    if (isOpen && currentAvatarUrl) {
      // Extract filename if full url or proxy path
      let clean = currentAvatarUrl;
      if (clean.includes('/')) {
        clean = clean.split('/').pop()?.split('?')[0] || clean;
      }
      setSelectedFilename(clean);
    }
  }, [isOpen, currentAvatarUrl]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedFilename) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSelectAvatar(selectedFilename);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el avatar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0b0f19] border border-slate-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Elige tu Avatar
              </h3>
              <p className="text-[11px] text-slate-400">
                Selecciona una foto para personalizar tu perfil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Avatar Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-xs">Cargando avatares disponibles...</p>
            </div>
          ) : isError || !avatars || avatars.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No se pudieron cargar los avatares. Por favor intenta nuevamente.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
              {avatars.map((av) => {
                const isSelected = selectedFilename === av.filename;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedFilename(av.filename)}
                    className={`group relative rounded-2xl p-1.5 border transition-all duration-200 flex flex-col items-center cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:scale-102'
                    }`}
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-700/50">
                      <img
                        src={getAvatarUrl(av.filename)}
                        alt={av.filename}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md animate-in zoom-in-50">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {selectedFilename ? `Seleccionado: ${selectedFilename}` : 'Ninguno seleccionado'}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!selectedFilename || isSaving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Guardar Avatar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
