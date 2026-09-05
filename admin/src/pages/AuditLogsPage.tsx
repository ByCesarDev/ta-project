import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, ShieldAlert, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { Table, Column } from '../components/common/Table.js';
import { Modal } from '../components/common/Modal.js';
import { AuditLog } from '../types/index.js';
import { formatDate } from '../lib/utils.js';

export const AuditLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      // 1. Fetch audit logs from PostgreSQL table
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('id, actor_id, action, entity_type, entity_id, metadata, ip, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      const rawLogs = logsData || [];
      const actorIds = Array.from(
        new Set(rawLogs.map((l) => l.actor_id).filter((id): id is string => Boolean(id)))
      );

      // 2. In-memory profile resolution (since audit_logs.actor_id points to auth.users)
      let profilesMap: Record<string, { username: string; avatar_url: string }> = {};
      if (actorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', actorIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = { username: p.username, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { username: string; avatar_url: string }>);
        }
      }

      return rawLogs.map((log) => ({
        ...log,
        metadata: (log.metadata as Record<string, unknown>) || null,
        profiles: log.actor_id ? profilesMap[log.actor_id] || null : null,
      })) as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      (l.entity_id && l.entity_id.toLowerCase().includes(q)) ||
      (l.profiles?.username && l.profiles.username.toLowerCase().includes(q)) ||
      (l.actor_id && l.actor_id.toLowerCase().includes(q))
    );
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Acción Ejecutada',
      cell: (log) => (
        <div>
          <span className="font-bold text-white text-sm font-mono">{log.action}</span>
          <span className="text-[11px] text-slate-500 block font-mono">
            {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Usuario / Moderador',
      cell: (log) => (
        <div className="flex items-center gap-2">
          {log.profiles?.avatar_url ? (
            <img
              src={log.profiles.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono">
              {log.profiles?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
          )}
          <div>
            <span className="font-semibold text-indigo-300 text-xs block">
              {log.profiles?.username || (log.actor_id ? `Usuario (${log.actor_id.slice(0, 8)})` : 'Sistema')}
            </span>
            {log.actor_id && (
              <span className="text-[10px] text-slate-500 font-mono block">
                {log.actor_id.slice(0, 12)}...
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Dirección IP',
      cell: (log) => (
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          {log.ip || 'Local / Interna'}
        </span>
      ),
    },
    {
      header: 'Fecha y Hora',
      cell: (log) => (
        <span className="text-xs text-slate-400 font-mono">
          {formatDate(log.created_at)}
        </span>
      ),
    },
    {
      header: 'Detalles',
      className: 'text-right',
      cell: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Ver metadata de la acción"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-indigo-400" />
          Registro de Auditoría y Seguridad
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historial inmutable de acciones administrativas y operaciones sensibles del sistema.
        </p>
      </div>

      {/* Search Filter */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por acción, usuario o entidad..."
            className="glass-input w-full pl-10 text-xs"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <Table
        columns={columns}
        data={filteredLogs || []}
        isLoading={isLoading}
        emptyMessage="No se encontraron registros de auditoría."
      />

      {/* Payload Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Metadatos de la Acción"
        subtitle={`Log ID: ${selectedLog?.id} • ${formatDate(selectedLog?.created_at || '')}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block">Acción:</span>
              <span className="font-mono text-white font-bold">{selectedLog?.action}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Entidad Afectada:</span>
              <span className="font-mono text-indigo-300">
                {selectedLog?.entity_type} {selectedLog?.entity_id ? `#${selectedLog.entity_id}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Actor ID:</span>
              <span className="font-mono text-slate-300">{selectedLog?.actor_id || 'Sistema'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dirección IP:</span>
              <span className="font-mono text-slate-300">{selectedLog?.ip || 'N/A'}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 mb-1.5 block">
              Metadata JSON:
            </span>
            <pre className="p-4 rounded-xl bg-[#07090e] border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-96">
              {JSON.stringify(selectedLog?.metadata || {}, null, 2)}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};
