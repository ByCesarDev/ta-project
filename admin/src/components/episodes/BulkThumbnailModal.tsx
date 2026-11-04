import React, { useState } from 'react';
import { Camera, Server, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { apiClient } from '../../lib/api.js';

interface BulkThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId: number;
  animeName: string;
  totalEpisodes: number;
  onSuccess?: () => void;
}

export const BulkThumbnailModal: React.FC<BulkThumbnailModalProps> = ({
  isOpen,
  onClose,
  animeId,
  animeName,
  totalEpisodes,
  onSuccess,
}) => {
  const [preferredProvider, setPreferredProvider] = useState<string>('any');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    successCount: number;
    failedCount: number;
    total: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartBulk = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setResultSummary(null);

    try {
      const payload: { provider?: string } = {};
      if (preferredProvider !== 'any') {
        payload.provider = preferredProvider;
      }

      const res = await apiClient.post<{
        success: boolean;
        summary: { successCount: number; failedCount: number; total: number };
        message: string;
      }>(`/thumbnails/animes/${animeId}/generate-all`, payload);

      setResultSummary(res.data.summary);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error durante la generación masiva.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generación Masiva de Portadas / Frames"
    >
      <div className="space-y-5 text-xs">
        <p className="text-slate-300">
          Esta función procesará en lote los <strong className="text-white">{totalEpisodes} episodios</strong> de{' '}
          <strong className="text-indigo-400">{animeName}</strong>, capturando un fotograma en alta definición para cada uno y subiéndolo a Supabase Storage.
        </p>

        {/* Error notice */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success summary */}
        {resultSummary && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1.5 font-medium animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Proceso de Generación Completado!</span>
            </div>
            <p className="text-xs text-emerald-200">
              Se generaron con éxito <strong>{resultSummary.successCount}</strong> de <strong>{resultSummary.total}</strong> portadas.
              {resultSummary.failedCount > 0 && (
                <span className="text-amber-300 ml-1">
                  ({resultSummary.failedCount} episodios no pudieron ser capturados por falta de streams directos activos).
                </span>
              )}
            </p>
          </div>
        )}

        {/* Preferred provider selection */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Servidor Preferido para la Captura
          </label>
          <select
            value={preferredProvider}
            onChange={(e) => setPreferredProvider(e.target.value)}
            disabled={isGenerating}
            className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="any">⚡ Cualquier servidor activo (Auto / Mejor calidad)</option>
            <option value="streamwish">Streamwish (HLS / MP4 Direct)</option>
            <option value="mega">Mega (Stream Directo)</option>
            <option value="yourupload">YourUpload (MP4 Direct)</option>
            <option value="mp4upload">Mp4Upload (MP4 Direct)</option>
            <option value="voe">Voe (HLS)</option>
            <option value="doodstream">Doodstream</option>
          </select>
          <p className="text-[10px] text-slate-500">
            Si el servidor preferido no está disponible o falla en algún episodio, el sistema recurrirá automáticamente a los demás servidores activos del episodio.
          </p>
        </div>

        {/* Processing Indicator */}
        {isGenerating && (
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center gap-3 text-indigo-300 animate-pulse">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
            <div>
              <p className="font-bold">Extrayendo fotogramas con FFmpeg...</p>
              <p className="text-[11px] text-indigo-400/80">
                Por favor espera mientras se descargan y procesan los fragmentos de video.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
            {resultSummary ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartBulk}
            isLoading={isGenerating}
            disabled={isGenerating || totalEpisodes === 0}
            icon={<Camera className="w-4 h-4" />}
          >
            {isGenerating ? 'Generando Portadas...' : 'Iniciar Generación Masiva'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
