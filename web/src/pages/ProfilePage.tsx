import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { User, Mail, Shield, Bookmark, History, LogOut, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, role, signOut, isLoading } = useAuth();

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

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mb-8 flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-400" />
          Mi Perfil de Usuario
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Card */}
          <div className="md:col-span-1 p-6 rounded-3xl bg-[#0c101c] border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black mx-auto shadow-xl border border-indigo-400/30 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile?.username?.charAt(0).toUpperCase() || 'U'
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">{profile?.username}</h2>
              <div className="mt-1 flex justify-center">
                <Badge variant={roleBadgeVariant} size="xs" className="uppercase tracking-wider font-bold">
                  {role}
                </Badge>
              </div>
            </div>

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
    </PageContainer>
  );
};
