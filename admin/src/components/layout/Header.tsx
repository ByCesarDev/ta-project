import React from 'react';
import { Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../common/Badge.js';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, profile, role, signOut } = useAuth();

  return (
    <header className="h-20 bg-[#090d16]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Supabase DB & API Conectados</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700/80"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300">
              <User className="w-5 h-5" />
            </div>
          )}

          <div className="hidden md:block text-left">
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              {profile?.username || user?.email?.split('@')[0]}
              {role === 'admin' ? (
                <Badge variant="danger" size="sm">
                  <ShieldCheck className="w-3 h-3" /> ADMIN
                </Badge>
              ) : (
                <Badge variant="purple" size="sm">
                  <ShieldCheck className="w-3 h-3" /> MOD
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => signOut()}
          title="Cerrar Sesión"
          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
