import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Clock, Calendar, Tv } from 'lucide-react';

import { supabase } from '../lib/supabase.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Table, Column } from '../components/common/Table.js';
import { AdminNotification } from '../types/index.js';
import { formatDate } from '../lib/utils.js';

export const NotificationsPage: React.FC = () => {
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*, animes(id, name, cover_image, slug)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AdminNotification[];
    },
  });

  const handleMarkAsRead = async (id: number) => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);
      refetch();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const columns: Column<AdminNotification>[] = [
    {
      header: 'Serie & Alerta',
      cell: (notif) => (
        <div className="flex items-center gap-3">
          {notif.animes?.cover_image ? (
            <img
              src={notif.animes.cover_image}
              alt={notif.animes.name}
              className="w-10 h-14 object-cover rounded-lg shrink-0 border border-slate-700/60"
            />
          ) : (
            <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
              <Tv className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-white text-sm">
              {notif.animes?.name || `Anime #${notif.anime_id}`}
            </h4>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
              Episodio {notif.episode_number}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tipo de Alerta',
      cell: (notif) => (
        <Badge
          variant={
            notif.alert_type === '1_day'
              ? 'danger'
              : notif.alert_type === '2_days'
              ? 'warning'
              : 'primary'
          }
          size="sm"
        >
          <Clock className="w-3 h-3" />
          {notif.alert_type === '1_day'
            ? '¡Estreno Mañana!'
            : notif.alert_type === '2_days'
            ? 'Estreno en 2 Días'
            : 'Estreno en 3 Días'}
        </Badge>
      ),
    },
    {
      header: 'Fecha de Emisión',
      cell: (notif) => (
        <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          {formatDate(notif.air_date)}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (notif) => (
        <Badge variant={notif.is_read ? 'default' : 'purple'} size="sm">
          {notif.is_read ? 'Leído' : 'Nuevo'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      cell: (notif) => (
        <div className="flex items-center justify-end">
          {!notif.is_read && (
            <Button
              variant="outline"
              size="sm"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={() => handleMarkAsRead(notif.id)}
            >
              Marcar Leído
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          Alertas de Emisión y Estrenos
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Notificaciones operativas automáticas para preparar nuevos episodios antes de su emisión.
        </p>
      </div>

      <Table
        columns={columns}
        data={notifications || []}
        isLoading={isLoading}
        emptyMessage="No tienes notificaciones pendientes de estreno."
      />
    </div>
  );
};
