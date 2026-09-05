import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Search } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.js';
import { Table, Column } from '../components/common/Table.js';
import { UserWithRole, UserRole, UserStatus } from '../types/index.js';
import { formatDate } from '../lib/utils.js';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Fetch all profiles along with their roles
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      // 1. Fetch profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profError) throw profError;

      // 2. Fetch roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('*');

      if (roleError) throw roleError;

      // Merge data
      const list: UserWithRole[] = (profiles || []).map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.id);
        return {
          id: p.id,
          username: p.username || 'Sin nombre',
          avatar_url: p.avatar_url || '',
          role: (userRole?.role || 'user') as UserRole,
          status: (userRole?.status || 'active') as UserStatus,
          created_at: p.created_at,
        };
      });

      return list;
    },
  });

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (targetUserId === currentUser?.id) {
      if (!confirm('¿Estás seguro de modificar tu propio rol? Podrías perder acceso al panel.')) {
        return;
      }
    }

    setUpdatingUserId(targetUserId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: targetUserId,
            role: newRole,
            updated_by: currentUser?.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar rol';
      alert(`Error: ${message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusChange = async (targetUserId: string, newStatus: UserStatus) => {
    if (targetUserId === currentUser?.id) {
      alert('No puedes suspender o banear tu propia cuenta de administrador.');
      return;
    }

    setUpdatingUserId(targetUserId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: targetUserId,
            status: newStatus,
            updated_by: currentUser?.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado';
      alert(`Error: ${message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users?.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const columns: Column<UserWithRole>[] = [
    {
      header: 'Usuario',
      cell: (user) => (
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700/60"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/60">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              {user.username}
              {user.id === currentUser?.id && (
                <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  TÚ
                </span>
              )}
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">{user.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Rol en la Plataforma',
      cell: (user) => {
        const isUpdating = updatingUserId === user.id;

        return (
          <div className="flex items-center gap-2">
            <select
              disabled={isUpdating}
              value={user.role}
              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
              className="glass-input py-1.5 px-3 text-xs bg-[#0b0f19] font-medium"
            >
              <option value="user">Usuario (user)</option>
              <option value="moderator">Moderador (moderator)</option>
              <option value="admin">Administrador (admin)</option>
            </select>
          </div>
        );
      },
    },
    {
      header: 'Estado de Cuenta',
      cell: (user) => {
        const isUpdating = updatingUserId === user.id;

        return (
          <div className="flex items-center gap-2">
            <select
              disabled={isUpdating}
              value={user.status}
              onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
              className={`glass-input py-1.5 px-3 text-xs font-medium ${
                user.status === 'active'
                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30'
                  : 'text-rose-400 bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <option value="active">Activo (active)</option>
              <option value="suspended">Suspendido (suspended)</option>
              <option value="banned">Baneado (banned)</option>
            </select>
          </div>
        );
      },
    },
    {
      header: 'Fecha Registro',
      cell: (user) => (
        <span className="text-xs text-slate-400 font-mono">
          {formatDate(user.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          Gestión de Usuarios y Roles RBAC
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Asigna roles de moderación y administra el estado de las cuentas en la plataforma.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de usuario o UUID..."
            className="glass-input w-full pl-10 text-xs"
          />
        </div>
      </div>

      {/* Users Table */}
      <Table
        columns={columns}
        data={filteredUsers || []}
        isLoading={isLoading}
        emptyMessage="No se encontraron usuarios."
      />
    </div>
  );
};
