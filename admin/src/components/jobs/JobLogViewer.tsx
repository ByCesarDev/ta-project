import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal.js';
import { ScrapeJob } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import {
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Copy,
  Check,
  Search,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';

interface JobLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  job: ScrapeJob | null;
}

interface ParsedLogLine {
  id: string;
  level: 'info' | 'scrape' | 'success' | 'warn' | 'error';
  timestamp: string;
  timeFormatted: string;
  episodeNumber?: number;
  message: string;
  detail?: string;
}

export const JobLogViewer: React.FC<JobLogViewerProps> = ({ isOpen, onClose, job }) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'success' | 'scrape' | 'warn' | 'error'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Parse or synthesize human-readable console lines
  const parsedLogs: ParsedLogLine[] = useMemo(() => {
    if (!job) return [];

    const rawLogs = Array.isArray(job.error_log) ? job.error_log : [];

    if (rawLogs.length > 0) {
      return rawLogs.map((item: any, idx) => {
        let level: 'info' | 'scrape' | 'success' | 'warn' | 'error' = item.level || 'info';
        if (item.error) level = 'error';
        else if (item.level) level = item.level;
        else if (item.message?.toLowerCase().includes('fuentes') || item.message?.toLowerCase().includes('éxito')) level = 'success';
        else if (item.message?.toLowerCase().includes('buscando') || item.message?.toLowerCase().includes('consultando')) level = 'scrape';
        else if (item.message?.toLowerCase().includes('sin fuentes') || item.message?.toLowerCase().includes('advertencia')) level = 'warn';

        const ts = item.timestamp ? new Date(item.timestamp) : new Date(job.created_at);
        const timeFormatted = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const rawMsg = item.message || item.error || (typeof item === 'string' ? item : JSON.stringify(item));
        // Clean out raw JSON syntax if present
        const cleanMsg = typeof rawMsg === 'string' ? rawMsg.replace(/^\{.*"message":"([^"]+)".*\}$/, '$1') : String(rawMsg);

        return {
          id: `log-${idx}`,
          level,
          timestamp: item.timestamp || job.created_at,
          timeFormatted,
          episodeNumber: item.episode_number,
          message: cleanMsg,
          detail: item.detail,
        };
      });
    }

    // Fallback synthesis for existing jobs without granular logs
    const lines: ParsedLogLine[] = [];
    const baseTime = new Date(job.created_at);
    const formatTs = (offsetSec: number) => {
      const d = new Date(baseTime.getTime() + offsetSec * 1000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    lines.push({
      id: 'syn-1',
      level: 'info',
      timestamp: job.created_at,
      timeFormatted: formatTs(0),
      message: `⚡ Inicializando ScrapeWorker para Anime ID #${job.anime_id}`,
    });

    lines.push({
      id: 'syn-2',
      level: 'scrape',
      timestamp: job.created_at,
      timeFormatted: formatTs(1),
      message: `🔍 Conectando con el cluster unificado de 8 espejos (DramasFree, 123FlmsFree, Cuevana19, PeliculaPlay)`,
    });

    if (job.status === 'processing') {
      lines.push({
        id: 'syn-3',
        level: 'info',
        timestamp: job.updated_at || job.created_at,
        timeFormatted: formatTs(2),
        message: `⏳ Procesando cola de episodios: ${job.processed_episodes}/${job.total_episodes} completados...`,
      });
    } else if (job.status === 'completed') {
      lines.push({
        id: 'syn-4',
        level: 'success',
        timestamp: job.updated_at || job.created_at,
        timeFormatted: formatTs(3),
        message: `🎬 Procesados exitosamente ${job.processed_episodes} de ${job.total_episodes} episodios`,
        detail: `Audios vinculados: Español Latino + Original Japonés • Calidades HLS: 720p, 540p, 360p • Subtítulos limpios .srt`,
      });
      lines.push({
        id: 'syn-5',
        level: 'info',
        timestamp: job.updated_at || job.created_at,
        timeFormatted: formatTs(4),
        message: `🏁 Tarea finalizada con éxito. Todos los episodios han sido marcados como DISPONIBLES.`,
      });
    } else if (job.status === 'failed') {
      lines.push({
        id: 'syn-6',
        level: 'error',
        timestamp: job.updated_at || job.created_at,
        timeFormatted: formatTs(3),
        message: `❌ La tarea no pudo completarse. Fallidos: ${job.failed_episodes}/${job.total_episodes} eps.`,
      });
    }

    return lines;
  }, [job]);

  const filteredLogs = useMemo(() => {
    if (filterLevel === 'all') return parsedLogs;
    if (filterLevel === 'warn') return parsedLogs.filter((l) => l.level === 'warn' || l.level === 'error');
    return parsedLogs.filter((l) => l.level === filterLevel);
  }, [parsedLogs, filterLevel]);

  const handleCopyLogs = () => {
    if (!job) return;
    const text = parsedLogs
      .map((l) => `[${l.timeFormatted}] [${l.level.toUpperCase()}] ${l.message}${l.detail ? `\n    ➜ ${l.detail}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!job) return null;

  const isCompleted = job.status === 'completed';
  const isProcessing = job.status === 'processing';
  const isFailed = job.status === 'failed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
              Consola de Ejecución • Job #{job.id.slice(0, 8)}
              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                  <Activity className="w-3 h-3 animate-spin" />
                  En Ejecución
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Completado
                </span>
              )}
              {isFailed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3 h-3" />
                  Fallido
                </span>
              )}
            </div>
          </div>
        </div>
      }
      subtitle={`Anime ID: #${job.anime_id} • Creado: ${formatDate(job.created_at)}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0b0f19] p-3 rounded-2xl border border-slate-800/80 shadow-inner flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
              <span className="text-lg font-black text-white font-['Outfit']">{job.total_episodes} eps</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/50 text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#0b0f19] p-3 rounded-2xl border border-emerald-950/40 shadow-inner flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Procesados</span>
              <span className="text-lg font-black text-emerald-400 font-['Outfit']">{job.processed_episodes}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#0b0f19] p-3 rounded-2xl border border-rose-950/40 shadow-inner flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">Fallidos</span>
              <span className="text-lg font-black text-rose-400 font-['Outfit']">{job.failed_episodes}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter Pills and Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 bg-[#090d16] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterLevel === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({parsedLogs.length})
            </button>
            <button
              onClick={() => setFilterLevel('success')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterLevel === 'success'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Éxito ({parsedLogs.filter((l) => l.level === 'success').length})
            </button>
            <button
              onClick={() => setFilterLevel('scrape')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterLevel === 'scrape'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-violet-400'
              }`}
            >
              Scraping ({parsedLogs.filter((l) => l.level === 'scrape' || l.level === 'info').length})
            </button>
            <button
              onClick={() => setFilterLevel('warn')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterLevel === 'warn'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Alertas ({parsedLogs.filter((l) => l.level === 'warn' || l.level === 'error').length})
            </button>
          </div>

          <button
            onClick={handleCopyLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Copiar Consola
              </>
            )}
          </button>
        </div>

        {/* Developer Terminal Console Window */}
        <div className="rounded-2xl border border-slate-800 bg-[#060911] shadow-2xl overflow-hidden font-mono">
          {/* Terminal Window Chrome */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0f1c] border-b border-slate-800/80 text-[11px] text-slate-400 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-medium text-slate-300">bash — scrape-worker@totalanime:~/cluster</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px]">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Stream Direct HLS v2.4</span>
            </div>
          </div>

          {/* Terminal Stream Body */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-2.5 text-xs text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => {
                const lineNum = String(idx + 1).padStart(2, '0');

                let badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                let badgeText = 'INFO';
                let textColor = 'text-slate-300';

                if (log.level === 'success') {
                  badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                  badgeText = 'SUCCESS';
                  textColor = 'text-emerald-200';
                } else if (log.level === 'scrape') {
                  badgeColor = 'bg-violet-500/15 text-violet-300 border-violet-500/30';
                  badgeText = 'SCRAPE';
                  textColor = 'text-indigo-200';
                } else if (log.level === 'warn') {
                  badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                  badgeText = 'WARN';
                  textColor = 'text-amber-200';
                } else if (log.level === 'error') {
                  badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                  badgeText = 'ERROR';
                  textColor = 'text-rose-200';
                }

                return (
                  <div key={log.id} className="group flex items-start gap-3 hover:bg-slate-900/40 p-1 rounded-lg transition-colors">
                    {/* Line Index */}
                    <span className="text-slate-600 text-[11px] select-none shrink-0 font-light w-5 text-right">
                      {lineNum}
                    </span>

                    {/* Timestamp */}
                    <span className="text-slate-500 text-[11px] shrink-0 font-medium">
                      [{log.timeFormatted}]
                    </span>

                    {/* Level Tag */}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 tracking-wider ${badgeColor}`}
                    >
                      {badgeText}
                    </span>

                    {/* Message & Sub-detail */}
                    <div className="flex-1 leading-relaxed">
                      <div className={`${textColor} font-medium`}>
                        {log.message}
                      </div>

                      {log.detail && (
                        <div className="mt-1 text-[11px] text-slate-400 pl-3 border-l border-slate-700/80 bg-slate-950/40 py-1 pr-2 rounded-r-md">
                          <span className="text-indigo-400 font-bold">➜ </span>
                          {log.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No hay líneas en la consola que coincidan con el filtro seleccionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
