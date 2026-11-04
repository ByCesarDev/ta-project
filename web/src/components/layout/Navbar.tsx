import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  Tv,
  Search,
  Bookmark,
  History,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Users,
  Settings,
  ChevronRight,
  SlidersHorizontal,
  Mail,
} from 'lucide-react';
import { Button } from '../common/Button.js';
import { getAvatarUrl } from '../../lib/utils.js';
import { useViewerProfile } from '../../context/ViewerProfileContext.js';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const {
    profiles,
    activeProfile,
    selectProfile,
    openSelectorModal,
    openManageModal,
  } = useViewerProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Directorio', path: '/directory' },
    { name: 'En Emisión', path: '/directory?status=RELEASING' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30 group-hover:scale-105 transition-transform duration-200">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight font-['Outfit']">
            Total<span className="text-indigo-400">Anime</span>
            <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
              2.0
            </span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname + location.search === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center relative flex-1 max-w-xs md:max-w-sm"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f19]/80 border border-slate-700/60 rounded-xl pl-10 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </form>

        {/* Right Actions: Auth & Profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md border border-indigo-400/30 overflow-hidden">
                  {activeProfile?.avatar_url || profile?.avatar_url ? (
                    <img
                      src={getAvatarUrl(activeProfile?.avatar_url || profile?.avatar_url)}
                      alt={activeProfile?.name || profile?.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (activeProfile?.name || profile?.username)?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 line-clamp-1">
                    {activeProfile?.display_name || activeProfile?.name || profile?.username || 'Mi Perfil'}
                  </span>
                  {profiles.length > 1 && (
                    <span className="text-[10px] text-indigo-400 font-semibold -mt-0.5">
                      Cambiar perfil
                    </span>
                  )}
                </div>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-3xl bg-[#0a0d16] border border-slate-800 shadow-2xl p-2.5 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-1.5"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  {/* Top Header Card: Perfil Activo */}
                  <div className="p-3 bg-slate-900/70 rounded-2xl border border-slate-800/90">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <img
                            src={getAvatarUrl(activeProfile?.avatar_url || profile?.avatar_url)}
                            alt={activeProfile?.display_name || activeProfile?.name || 'Perfil'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate">
                            {activeProfile?.display_name || activeProfile?.name || 'Perfil'}
                          </p>
                          <p className="text-[11px] font-mono text-indigo-400 truncate -mt-0.5">
                            @{activeProfile?.username || 'usuario'}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium">Perfil activo</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0">
                        Activo
                      </span>
                    </div>
                  </div>

                  {/* Section 1: CAMBIAR DE PERFIL */}
                  <div className="py-1 border-t border-slate-800/70">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-2 py-1">
                      Cambiar de perfil
                    </p>

                    {/* Other profiles list */}
                    {profiles
                      .filter((p) => p.id !== activeProfile?.id)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            selectProfile(p.id);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 group-hover:border-indigo-400 shrink-0">
                              <img src={getAvatarUrl(p.avatar_url)} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                                {p.display_name || p.name}
                              </p>
                              {p.username && (
                                <p className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 truncate -mt-0.5">
                                  @{p.username}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                        </button>
                      ))}

                    {/* Ver todos los perfiles */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openSelectorModal();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group cursor-pointer text-left mt-0.5"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs">Ver todos los perfiles</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                    </button>

                    {/* Administrar perfiles */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openManageModal();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs">Administrar perfiles</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                    </button>
                  </div>

                  {/* Section 2: MI PERFIL */}
                  <div className="py-1 border-t border-slate-800/70">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-2 py-1">
                      Mi Perfil
                    </p>

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs">Ver mi perfil</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                    </Link>

                    <Link
                      to="/watchlist"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs">Mi lista</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs">Historial</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                    </Link>
                  </div>

                  {/* Section 3: CUENTA */}
                  <div className="py-1 border-t border-slate-800/70">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-2 py-1">
                      Cuenta
                    </p>

                    {/* Account Identity Card */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 text-left">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {profile?.username || 'Cuenta'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate -mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/settings/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs">Ajustes de cuenta</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer mt-0.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Ingresar
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#07090e]/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in duration-200">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </form>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  to="/watchlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4 text-indigo-400" />
                  Mi Lista
                </Link>
                <Link
                  to="/history"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <History className="w-4 h-4 text-violet-400" />
                  Historial
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
