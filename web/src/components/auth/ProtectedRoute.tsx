import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Tv, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Initial auth verification: Render dark splash screen preventing any FOUC
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white relative overflow-hidden select-none">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/50 border border-indigo-400/40 animate-pulse">
            <Tv className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-black tracking-tight font-['Outfit'] text-white">
              Total<span className="text-indigo-400">Anime</span> 2.0
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Verificando sesión...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login while preserving target path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated: Render protected application route
  return <>{children}</>;
};
