import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useViewerProfile } from '../context/ViewerProfileContext.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { AvatarSelectModal } from '../components/profile/AvatarSelectModal.js';
import { supabase } from '../lib/supabase.js';
import { getAvatarUrl } from '../lib/utils.js';
import {
  Mail,
  User,
  Shield,
  KeyRound,
  Calendar,
  Camera,
  CheckCircle,
  Users,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { user, profile, role, signOut, isLoading, refreshProfile } = useAuth();
  const { openManageModal, profiles } = useViewerProfile();

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-xs text-slate-400">Cargando ajustes de cuenta...</div>
      </PageContainer>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleBadgeVariant = role === 'admin' ? 'rose' : role === 'moderator' ? 'amber' : 'primary';

  const handleAvatarSelect = async (filename: string) => {
    if (!user) return;
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: filename })
        .eq('id', user.id);

      if (error) {
        const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
        const apiBase = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch(`${apiBase}/avatars/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ filename }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || error.message || 'Error al guardar avatar');
        }
      }

      await refreshProfile();
      setSuccessToast('Avatar de la cuenta actualizado');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar avatar de la cuenta');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setSuccessToast('Contraseña actualizada correctamente.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar contraseña.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Configuración Global</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              Ajustes de la Cuenta
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestiona los datos de acceso, credenciales de autenticación y seguridad de tu cuenta.
            </p>
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all w-fit"
          >
            <User className="w-4 h-4 text-indigo-400" />
            <span>Ir a Mi Perfil Activo</span>
          </Link>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Profile Card */}
          <div className="md:col-span-1 p-6 rounded-3xl bg-[#0c101c] border border-slate-800 text-center space-y-4 shadow-xl">
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="group relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black mx-auto shadow-xl border border-indigo-400/30 overflow-hidden cursor-pointer hover:border-indigo-400 transition-all hover:scale-105"
              title="Cambiar avatar de la cuenta"
            >
              {profile?.avatar_url ? (
                <img
                  src={getAvatarUrl(profile.avatar_url)}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.username?.charAt(0).toUpperCase() || 'U'
              )}

              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1">
                <Camera className="w-5 h-5 text-indigo-300" />
                <span>Cambiar</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">{profile?.username}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
              <div className="mt-2.5 flex justify-center">
                <Badge variant={roleBadgeVariant} size="sm" className="uppercase tracking-wider font-bold">
                  {role}
                </Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors inline-block cursor-pointer"
            >
              Cambiar foto de cuenta
            </button>

            <div className="pt-3 border-t border-slate-800/80">
              <Button
                variant="danger"
                size="sm"
                onClick={() => signOut()}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="w-full"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>

          {/* Details & Security Sections */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Details Box */}
            <div className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield className="w-4 h-4 text-indigo-400" />
                Datos de Identidad de la Cuenta
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    Usuario de la cuenta
                  </span>
                  <span className="font-semibold text-slate-200">{profile?.username}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    Correo electrónico
                  </span>
                  <span className="font-semibold text-slate-200">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Fecha de registro
                  </span>
                  <span className="font-semibold text-slate-200">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Perfiles asociados */}
            <div className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Perfiles de Espectador Asociados ({profiles.length}/5)
                </h3>
                <button
                  onClick={openManageModal}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Administrar
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                      <img src={getAvatarUrl(p.avatar_url)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                        {p.display_name || p.name}
                      </p>
                      {p.username && (
                        <p className="text-[10px] font-mono text-indigo-400 truncate -mt-0.5">
                          @{p.username}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Password Update Form */}
            <form onSubmit={handlePasswordChange} className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2 pb-2 border-b border-slate-800">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Seguridad y Contraseña
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newPassword || !confirmPassword || isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AvatarSelectModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profile?.avatar_url}
        onSelectAvatar={handleAvatarSelect}
      />
    </PageContainer>
  );
};
