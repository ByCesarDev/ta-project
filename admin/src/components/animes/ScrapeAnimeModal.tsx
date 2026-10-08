import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Layers,
  Volume2,
  Globe,
  Radio,
} from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { apiClient } from '../../lib/api.js';
import { Anime, SourcePreviewResult } from '../../types/index.js';

interface ScrapeAnimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime | null;
  targetEpisodeNumber?: number;
  onSuccess?: () => void;
}

export const ScrapeAnimeModal: React.FC<ScrapeAnimeModalProps> = ({
  isOpen,
  onClose,
  anime,
  targetEpisodeNumber,
  onSuccess,
}) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'single' | 'pending'>('all');
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SourcePreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (anime && isOpen) {
      const initialUrl = anime.source_url || '';
      setSourceUrl(initialUrl);
      setPreviewData(null);
      setPreviewError(null);
      setSubmitError(null);

      if (typeof targetEpisodeNumber === 'number') {
        setTargetMode('single');
        setSelectedEpisode(targetEpisodeNumber);
      } else if (anime.status === 'finalizado') {
        setTargetMode('all');
      } else {
        setTargetMode('single');
        setSelectedEpisode(1);
      }

      if (initialUrl) {
        handleInspectSource(initialUrl);
      }
    }
  }, [anime, isOpen, targetEpisodeNumber]);

  const handleInspectSource = useCallback(async (urlToInspect: string) => {
    const clean = urlToInspect.trim();
    if (!clean) {
      setPreviewData(null);
      setPreviewError(null);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);

    try {
      const res = await apiClient.post<{ success: boolean; preview: SourcePreviewResult }>(
        '/jobs/preview-source',
        { sourceUrl: clean }
      );
      if (res.data?.preview) {
        setPreviewData(res.data.preview);
        if (res.data.preview.published_episodes.length > 0) {
          if (typeof targetEpisodeNumber !== 'number') {
            setSelectedEpisode(res.data.preview.published_episodes[0] || 1);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo analizar la URL de la fuente';
      setPreviewError(msg);
      setPreviewData(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [targetEpisodeNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anime) return;

    const cleanUrl = sourceUrl.trim();
    if (!cleanUrl) {
      setSubmitError('Por favor ingresa un enlace o hash de Seekee / Cluster.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await apiClient.post('/jobs/scrape', {
        animeId: anime.id,
        sourceUrl: cleanUrl,
        targetMode,
        targetEpisodeNumber: targetMode === 'single' ? selectedEpisode : undefined,
        totalEpisodes: previewData?.published_episodes?.length || anime.episodes,
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al encolar job de scraping';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!anime) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Scrapear Fuentes • ${anime.name}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. SOURCE URL INPUT */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enlace o Hash de la Fuente (Seekee / Cluster)</span>
            </label>
            {anime.source_url && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fuente memorizada
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => {
                const val = e.target.value;
                setSourceUrl(val);
                if (val.length >= 10) {
                  handleInspectSource(val);
                }
              }}
              onBlur={() => {
                if (sourceUrl.trim()) handleInspectSource(sourceUrl);
              }}
              placeholder="Ej: https://peliculaplay.com/es/detail/drama/4nw3c40KjANLxASvu0cuV-Tougen-Anki"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-all pr-24"
            />
            <button
              type="button"
              disabled={isPreviewLoading || !sourceUrl.trim()}
              onClick={() => handleInspectSource(sourceUrl)}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isPreviewLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>Inspeccionar</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Pega el link de la serie obtenido en Seekee (o espejos como Peliculaplay, Cuevana4br, DramasFree).
          </p>
        </div>

        {/* 2. LIVE SOURCE PREVIEW CARD */}
        {isPreviewLoading && (
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Analizando ficha, versiones de audio y episodios publicados...</span>
          </div>
        )}

        {previewError && !isPreviewLoading && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Aviso de inspección</p>
              <p className="text-[11px] text-amber-300/80">{previewError}</p>
            </div>
          </div>
        )}

        {previewData && !isPreviewLoading && (
          <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3.5 shadow-xl">
            <div className="flex items-start gap-3.5">
              {previewData.cover_image && (
                <img
                  src={previewData.cover_image}
                  alt={previewData.title}
                  className="w-12 h-16 object-cover rounded-xl border border-indigo-500/20 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" size="sm">
                    {previewData.category_name.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {previewData.source_id.slice(0, 16)}...
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm truncate mt-1">
                  {previewData.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {previewData.total_episodes_found} episodios detectados en la fuente
                </p>
              </div>
            </div>

            {/* Audio Variants Badges */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Versiones de audio descubiertas ({previewData.variants.length}):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {previewData.variants.map((v) => (
                  <span
                    key={v.variant_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] text-slate-200 font-medium"
                  >
                    <Globe className="w-3 h-3 text-indigo-400" />
                    <span>{v.language_label}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white/10 text-slate-400 font-mono">
                      {v.audio_language}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SCOPE SELECTOR */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Alcance de Episodios a Procesar</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTargetMode('all')}
              className={`p-3 rounded-xl border text-left transition-all ${
                targetMode === 'all'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Todos los episodios</span>
                <Radio className={`w-3.5 h-3.5 ${targetMode === 'all' ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Para animes finalizados o catálogo completo.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode('single')}
              className={`p-3 rounded-xl border text-left transition-all ${
                targetMode === 'single'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Capítulo específico</span>
                <Radio className={`w-3.5 h-3.5 ${targetMode === 'single' ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Para animes en emisión al salir nuevo estreno.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode('pending')}
              className={`p-3 rounded-xl border text-left transition-all ${
                targetMode === 'pending'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Solo pendientes</span>
                <Radio className={`w-3.5 h-3.5 ${targetMode === 'pending' ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Solo capítulos sin fuentes o fallidos.
              </p>
            </button>
          </div>
        </div>

        {/* 4. SPECIFIC EPISODE SELECTOR (IF SINGLE MODE) */}
        {targetMode === 'single' && (
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Número de Episodio a scrapear</span>
            </label>
            <div className="flex items-center gap-3">
              {previewData?.published_episodes && previewData.published_episodes.length > 0 ? (
                <select
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {previewData.published_episodes.map((epNum) => (
                    <option key={epNum} value={epNum}>
                      Episodio #{epNum}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(parseFloat(e.target.value) || 1)}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              )}
              <span className="text-[11px] text-slate-400">
                Se importarán todas las variantes de audio de este capítulo.
              </span>
            </div>
          </div>
        )}

        {/* 5. INFORMATION BANNER */}
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Se importarán y verificarán automáticamente todos los audios, subtítulos y calidades disponibles.
          </span>
        </div>

        {/* 6. MODAL ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !sourceUrl.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encolando Job...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Iniciar Scraping</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
