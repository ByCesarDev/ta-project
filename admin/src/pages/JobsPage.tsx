import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Table, Column } from '../components/common/Table.js';
import { JobLogViewer } from '../components/jobs/JobLogViewer.js';
import { ScrapeJob } from '../types/index.js';
import { formatDate } from '../lib/utils.js';

export const JobsPage: React.FC = () => {
  const [selectedJobForLogs, setSelectedJobForLogs] = useState<ScrapeJob | null>(null);

  // Poll scrape jobs every 3 seconds
  const { data: jobs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['scrape-jobs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*, animes(id, name, slug)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ScrapeJob[];
    },
    refetchInterval: 3000, // Real-time polling
  });

  const columns: Column<ScrapeJob>[] = [
    {
      header: 'Job ID & Anime',
      cell: (job) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono text-xs text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              {job.animes?.name || `Anime #${job.anime_id}`}
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">{job.id.slice(0, 18)}...</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (job) => {
        const statusConfig = {
          pending: { variant: 'warning' as const, icon: Clock, label: 'Pendiente' },
          processing: { variant: 'primary' as const, icon: Loader2, label: 'Procesando' },
          completed: { variant: 'success' as const, icon: CheckCircle2, label: 'Completado' },
          failed: { variant: 'danger' as const, icon: AlertTriangle, label: 'Fallido' },
        }[job.status] || { variant: 'default' as const, icon: Clock, label: job.status };

        const Icon = statusConfig.icon;

        return (
          <Badge variant={statusConfig.variant} size="sm">
            <Icon className={`w-3 h-3 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </Badge>
        );
      },
    },
    {
      header: 'Progreso',
      cell: (job) => {
        const total = job.total_episodes || 1;
        const progressPct = Math.min(100, Math.round((job.processed_episodes / total) * 100));

        return (
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">
                {job.processed_episodes} / {job.total_episodes} eps
              </span>
              <span className="text-indigo-400 font-bold">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  job.status === 'failed'
                    ? 'bg-rose-500'
                    : job.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Fallidos',
      cell: (job) => (
        <span
          className={`font-mono text-xs font-bold ${
            job.failed_episodes > 0 ? 'text-rose-400' : 'text-slate-500'
          }`}
        >
          {job.failed_episodes} eps
        </span>
      ),
    },
    {
      header: 'Fecha',
      cell: (job) => (
        <span className="text-xs text-slate-400 font-mono">
          {formatDate(job.created_at)}
        </span>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      cell: (job) => (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={<Terminal className="w-3.5 h-3.5 text-indigo-400" />}
            onClick={() => setSelectedJobForLogs(job)}
          >
            Logs ({job.error_log?.length || 0})
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Monitor de Tareas en Segundo Plano
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cola asíncrona de extracción de servidores de video ejecutada por los workers de Render.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Actualizar Cola
        </Button>
      </div>

      {/* Jobs Table */}
      <Table
        columns={columns}
        data={jobs || []}
        isLoading={isLoading}
        emptyMessage="No hay tareas de scraping registradas."
      />

      {/* Job Log Viewer Modal */}
      <JobLogViewer
        isOpen={Boolean(selectedJobForLogs)}
        onClose={() => setSelectedJobForLogs(null)}
        job={selectedJobForLogs}
      />
    </div>
  );
};
