import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Save, Loader2, Tv } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Episode, EpisodeSource, StreamLanguage } from '../../types/index.js';
import { supabase } from '../../lib/supabase.js';

interface EpisodeSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode | null;
  animeName: string;
  onSuccess?: () => void;
}

export const EpisodeSourcesModal: React.FC<EpisodeSourcesModalProps> = ({
  isOpen,
  onClose,
  episode,
  animeName,
  onSuccess,
}) => {
  const [sources, setSources] = useState<EpisodeSource[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (episode && isOpen) {
      loadSources(episode.id);
    } else {
      setSources([]);
      setDeletedIds([]);
    }
  }, [episode, isOpen]);

  const loadSources = async (episodeId: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('episode_sources')
        .select('*')
        .eq('episode_id', episodeId)
        .order('priority', { ascending: true });

      if (error) throw error;
      setSources(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar fuentes';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = () => {
    if (!episode) return;
    const newSource: EpisodeSource = {
      episode_id: episode.id,
      provider: 'mega',
      server_name: 'Mega',
      embed_url: '',
      language: 'sub',
      quality: '1080p',
      priority: (sources.length + 1) * 10,
      is_active: true,
    };
    setSources([...sources, newSource]);
  };

  const handleUpdateSource = (index: number, field: keyof EpisodeSource, value: any) => {
    const updated = [...sources];
    if (!updated[index]) return;

    updated[index] = { ...updated[index], [field]: value };

    // Auto-update server name if provider changed
    if (field === 'provider') {
      const names: Record<string, string> = {
        mega: 'Mega',
        streamwish: 'StreamWish',
        filemoon: 'FileMoon',
        streamtape: 'Streamtape',
        mp4upload: 'Mp4Upload',
        yourupload: 'YourUpload',
        okru: 'Okru',
        doodstream: 'DoodStream',
      };
      updated[index].server_name = names[value] || value.toUpperCase();
    }

    setSources(updated);
  };

  const handleDeleteSource = (index: number) => {
    const sourceToDelete = sources[index];
    if (sourceToDelete?.id) {
      setDeletedIds((prev) => [...prev, sourceToDelete.id!]);
    }
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!episode) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      // 1. Delete removed sources
      if (deletedIds.length > 0) {
        const { error: delError } = await supabase
          .from('episode_sources')
          .delete()
          .in('id', deletedIds);
        if (delError) throw delError;
      }

      // 2. Upsert current sources
      if (sources.length > 0) {
        const payload = sources.map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          episode_id: episode.id,
          provider: s.provider,
          server_name: s.server_name,
          embed_url: s.embed_url.trim(),
          language: s.language,
          quality: s.quality,
          priority: s.priority,
          is_active: s.is_active,
          last_verified_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('episode_sources')
          .upsert(payload, { onConflict: 'episode_id,provider,language,quality' });

        if (upsertError) throw upsertError;
      }

      // 3. If sources exist, make sure episode is marked available
      if (sources.length > 0) {
        await supabase
          .from('episodes')
          .update({ status: 'available', updated_at: new Date().toISOString() })
          .eq('id', episode.id);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar fuentes';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-indigo-400" />
          Servidores de Streaming: Episodio {episode?.episode_number}
        </span>
      }
      subtitle={`${animeName} • Gestión N-aria de fuentes y reproductores`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando servidores configurados...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
                No hay servidores configurados para este episodio todavía.
              </div>
            ) : (
              sources.map((source, index) => (
                <div
                  key={index}
                  className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 border border-slate-800/80"
                >
                  {/* Provider Selector */}
                  <div className="w-full md:w-40">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Servidor
                    </label>
                    <select
                      value={source.provider}
                      onChange={(e) => handleUpdateSource(index, 'provider', e.target.value)}
                      className="glass-input w-full py-1.5 text-xs bg-[#0b0f19]"
                    >
                      <option value="mega">Mega</option>
                      <option value="streamwish">StreamWish</option>
                      <option value="filemoon">FileMoon</option>
                      <option value="streamtape">Streamtape</option>
                      <option value="mp4upload">Mp4Upload</option>
                      <option value="yourupload">YourUpload</option>
                      <option value="okru">Okru</option>
                      <option value="doodstream">DoodStream</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  {/* Embed URL Input */}
                  <div className="w-full md:flex-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Embed URL / Enlace
                    </label>
                    <input
                      type="url"
                      value={source.embed_url}
                      onChange={(e) => handleUpdateSource(index, 'embed_url', e.target.value)}
                      placeholder="https://mega.nz/embed/... o https://streamwish.to/e/..."
                      className="glass-input w-full py-1.5 text-xs font-mono"
                    />
                  </div>

                  {/* Language */}
                  <div className="w-1/2 md:w-24">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Audio
                    </label>
                    <select
                      value={source.language}
                      onChange={(e) =>
                        handleUpdateSource(index, 'language', e.target.value as StreamLanguage)
                      }
                      className="glass-input w-full py-1.5 text-xs bg-[#0b0f19]"
                    >
                      <option value="sub">SUB</option>
                      <option value="dub">DUB</option>
                    </select>
                  </div>

                  {/* Quality */}
                  <div className="w-1/2 md:w-28">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Calidad
                    </label>
                    <select
                      value={source.quality}
                      onChange={(e) => handleUpdateSource(index, 'quality', e.target.value)}
                      className="glass-input w-full py-1.5 text-xs bg-[#0b0f19]"
                    >
                      <option value="1080p">1080p HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                      <option value="auto">Multi (Auto)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="w-1/2 md:w-20">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Prioridad
                    </label>
                    <input
                      type="number"
                      value={source.priority}
                      onChange={(e) =>
                        handleUpdateSource(index, 'priority', parseInt(e.target.value, 10) || 10)
                      }
                      className="glass-input w-full py-1.5 text-xs"
                    />
                  </div>

                  {/* Active Toggle & Delete */}
                  <div className="flex items-center gap-2 pt-4 md:pt-4 shrink-0">
                    {source.embed_url && (
                      <a
                        href={source.embed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Abrir enlace en nueva pestaña"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSource(index)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Eliminar servidor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAddSource}
              className="w-full mt-2"
            >
              Añadir Servidor de Streaming
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {sources.length} servidor(es) en lista
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
              onClick={handleSave}
            >
              Guardar Servidores
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
