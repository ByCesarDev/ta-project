import React from 'react';
import { Modal } from '../common/Modal.js';
import { ScrapeJob } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import { Terminal, AlertCircle } from 'lucide-react';

interface JobLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  job: ScrapeJob | null;
}

export const JobLogViewer: React.FC<JobLogViewerProps> = ({ isOpen, onClose, job }) => {
  if (!job) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          Registro de Ejecución (Logs): Job {job.id.slice(0, 8)}
        </span>
      }
      subtitle={`Anime ID: ${job.anime_id} • Creado: ${formatDate(job.created_at)}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
            <span className="text-base font-bold text-white">{job.total_episodes} eps</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Procesados</span>
            <span className="text-base font-bold text-emerald-400">{job.processed_episodes}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Fallidos</span>
            <span className="text-base font-bold text-rose-400">{job.failed_episodes}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Entradas del Registro de Errores ({job.error_log?.length || 0})
          </h4>

          {job.error_log && job.error_log.length > 0 ? (
            <div className="bg-[#07090e] p-4 rounded-xl border border-slate-800 max-h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-2">
              {job.error_log.map((log, idx) => (
                <div key={idx} className="pb-2 border-b border-slate-800/60 last:border-none">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    {log.episode_number ? (
                      <span className="text-amber-400">Episodio {log.episode_number}</span>
                    ) : (
                      <span>General</span>
                    )}
                    <span>{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="text-rose-300">{log.error || log.message || JSON.stringify(log)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#07090e] p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
              Sin errores registrados durante la ejecución de esta tarea.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
