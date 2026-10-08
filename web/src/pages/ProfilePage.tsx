import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { AvatarSelectModal } from '../components/profile/AvatarSelectModal.js';
import { supabase } from '../lib/supabase.js';
import { getAvatarUrl } from '../lib/utils.js';
import {
  User,
  Mail,
  Shield,
  Bookmark,
  History,
  LogOut,
  Calendar,
  Camera,
  CheckCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, role, signOut, isLoading, refreshProfile } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-xs text-slate-400">Cargando perfil...</div>
      </PageContainer>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleBadgeVariant = role === 'admin' ? 'rose' : role === 'moderator' ? 'amber' : 'primary';

  const handleAvatarSelect = async (filename: string) => {
    if (!user) return;

    // 1. Direct Supabase update (only permitted avatar_url column)
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: filename,
      })
      .eq('id', user.id);

    if (error) {
      // 2. Fallback to API endpoint if direct DB update fails
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
    setSuccessToast('Avatar actualizado correctamente');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-2.5">
            <User className="w-7 h-7 text-indigo-400" />
            Mi Perfil de Usuario
          </h1>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Card */}
          <div className="md:col-span-1 p-6 rounded-3xl bg-[#0c101c] border border-slate-800 text-center space-y-4 shadow-xl">
            {/* Clickable Profile Picture with Hover Edit Overlay */}
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="group relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black mx-auto shadow-xl border border-indigo-400/30 overflow-hidden cursor-pointer hover:border-indigo-400 transition-all hover:scale-105"
              title="Cambiar avatar de perfil"
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

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1">
                <Camera className="w-5 h-5 text-indigo-300" />
                <span>Cambiar</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">{profile?.username}</h2>
              <div className="mt-1 flex justify-center">
                <Badge variant={roleBadgeVariant} size="sm" className="uppercase tracking-wider font-bold">
                  {role}
                </Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-block"
            >
              Cambiar foto de perfil
            </button>

            <div className="pt-2 border-t border-slate-800/80">
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

          {/* Account Details & Quick Shortcuts */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Details Box */}
            <div className="p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield className="w-4 h-4 text-indigo-400" />
                Información de la Cuenta
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    Nombre de Usuario
                  </span>
                  <span className="font-semibold text-slate-200">{profile?.username}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    Correo Electrónico
                  </span>
                  <span className="font-semibold text-slate-200">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Miembro desde
                  </span>
                  <span className="font-semibold text-slate-200">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/watchlist"
                className="p-5 rounded-2xl bg-[#0c101c] border border-slate-800 hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Outfit']">Favoritos</h4>
                  <p className="text-[11px] text-slate-400">Ver animes guardados</p>
                </div>
              </Link>

              <Link
                to="/history"
                className="p-5 rounded-2xl bg-[#0c101c] border border-slate-800 hover:border-violet-500/50 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3 group-hover:scale-105 transition-transform">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Outfit']">Historial</h4>
                  <p className="text-[11px] text-slate-400">Ver episodios vistos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Select Modal */}
      <AvatarSelectModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profile?.avatar_url}
        onSelectAvatar={handleAvatarSelect}
      />
    </PageContainer>
  );
};
