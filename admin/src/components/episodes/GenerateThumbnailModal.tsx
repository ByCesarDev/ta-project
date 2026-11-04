import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Clock, Server, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Episode, EpisodeSource } from '../../types/index.js';
import { apiClient } from '../../lib/api.js';

interface GenerateThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: (Episode & { episode_sources?: EpisodeSource[] }) | null;
  animeName: string;
  onSuccess?: () => void;
}

export const GenerateThumbnailModal: React.FC<GenerateThumbnailModalProps> = ({
  isOpen,
  onClose,
  episode,
  animeName,
  onSuccess,
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>('auto');
  const [captureMode, setCaptureMode] = useState<'random' | 'custom'>('random');
  const [customTimestamp, setCustomTimestamp] = useState<string>('00:04:30');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusResult, setStatusResult] = useState<{ type: 'success' | 'error'; message: string; previewUrl?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSourceId('auto');
      setCaptureMode('random');
      setStatusResult(null);
    }
  }, [isOpen, episode]);

  if (!episode) return null;

  const activeSources = episode.episode_sources || [];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusResult(null);

    try {
      const payload: { sourceId?: number; timestamp?: string } = {};

      if (selectedSourceId !== 'auto') {
        payload.sourceId = parseInt(selectedSourceId, 10);
      }

      if (captureMode === 'custom' && customTimestamp.trim()) {
        payload.timestamp = customTimestamp.trim();
      }

      const res = await apiClient.post<{
        success: boolean;
        thumbnail_url: string;
        source_used?: string;
        message: string;
      }>(`/thumbnails/episodes/${episode.id}/generate`, payload);

      setStatusResult({
        type: 'success',
        message: res.data.message || 'Portada generada y guardada exitosamente.',
        previewUrl: res.data.thumbnail_url,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setStatusResult({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error al generar la portada.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Capturar Portada — Episodio ${episode.episode_number}`}
    >
      <div className="space-y-5 text-xs">
        {/* Info subtitle */}
        <p className="text-slate-400">
          Selecciona el servidor de video y el fotograma deseado para generar la portada del{' '}
          <strong className="text-white">Episodio {episode.episode_number}</strong> de{' '}
          <strong className="text-indigo-400">{animeName}</strong>.
        </p>

        {/* Status notification */}
        {statusResult && (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 font-medium animate-in slide-in-from-top duration-200 ${
              statusResult.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusResult.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p>{statusResult.message}</p>
            </div>
          </div>
        )}

        {/* Preview current vs new */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="relative w-32 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 flex items-center justify-center">
            {statusResult?.previewUrl || episode.thumbnail ? (
              <img
                src={statusResult?.previewUrl || episode.thumbnail}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-5 h-5" />
                <span className="text-[9px] mt-1 font-mono">Sin Portada</span>
              </div>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              {statusResult?.previewUrl ? 'Nueva Portada Generada' : 'Portada Actual'}
            </span>
            <p className="text-slate-300">
              {statusResult?.previewUrl
                ? '¡Captura completada y guardada en Supabase Storage!'
                : episode.thumbnail
                ? 'Ya cuenta con una portada. Puedes capturar otra para reemplazarla.'
                : 'Aún no tiene portada asignada.'}
            </p>
          </div>
        </div>

        {/* Server selection */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Servidor de Video a Utilizar
          </label>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="auto">⚡ Automático (Cualquier servidor activo con mejor prioridad)</option>
            {activeSources.map((s) => (
              <option key={s.id || Math.random()} value={String(s.id)}>
                {s.server_name || s.provider.toUpperCase()} — {s.quality || '1080p'} ({s.language?.toUpperCase() || 'SUB'}) {s.is_active ? '✅' : '⚠️ Inactivo'}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">
            {activeSources.length === 0
              ? '⚠️ No hay servidores enlazados a este episodio. Añade servidores antes de capturar.'
              : `${activeSources.length} servidor(es) configurado(s) para este episodio.`}
          </p>
        </div>

        {/* Timestamp selection */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Fotograma del Episodio
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setCaptureMode('random')}
              className={`p-3 rounded-xl border text-left transition-all ${
                captureMode === 'random'
                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Aleatorio Inteligente</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Calcula un segundo entre el 15% y 65% del episodio para evitar intros y pantallas negras.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCaptureMode('custom')}
              className={`p-3 rounded-xl border text-left transition-all ${
                captureMode === 'custom'
                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Tiempo Específico</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Indica el minuto o segundo exacto donde quieres capturar la escena.
              </p>
            </button>
          </div>

          {captureMode === 'custom' && (
            <div className="pt-2 animate-in fade-in duration-150">
              <input
                type="text"
                value={customTimestamp}
                onChange={(e) => setCustomTimestamp(e.target.value)}
                placeholder="Ejemplo: 00:04:30 o 00:12:15"
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formato aceptado: <code className="text-slate-400">HH:MM:SS</code> o <code className="text-slate-400">MM:SS</code>
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={isGenerating || activeSources.length === 0}
            icon={<Camera className="w-4 h-4" />}
          >
            Extraer y Guardar Portada
          </Button>
        </div>
      </div>
    </Modal>
  );
};
