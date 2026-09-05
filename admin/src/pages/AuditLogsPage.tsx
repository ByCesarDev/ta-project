import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye } from 'lucide-react';
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
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      l.entity_id.toLowerCase().includes(q) ||
      (l.profiles?.username && l.profiles.username.toLowerCase().includes(q))
    );
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Acción Ejecutada',
      cell: (log) => (
        <div>
          <span className="font-bold text-white text-sm font-mono">{log.action}</span>
          <span className="text-[11px] text-slate-500 block font-mono">
            {log.entity_type} #{log.entity_id}
          </span>
        </div>
      ),
    },
    {
      header: 'Usuario / Moderador',
      cell: (log) => (
        <span className="font-medium text-indigo-400 text-xs">
          {log.profiles?.username || log.user_id.slice(0, 8)}
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
          title="Ver JSON de detalles"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
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
            placeholder="Buscar por acción o entidad..."
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
        title="Detalles de la Acción"
        subtitle={`Log ID: ${selectedLog?.id} • ${formatDate(selectedLog?.created_at)}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <pre className="p-4 rounded-xl bg-[#07090e] border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-96">
            {JSON.stringify(selectedLog?.details, null, 2)}
          </pre>
        </div>
      </Modal>
    </div>
  );
};
