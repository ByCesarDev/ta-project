import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { user, isStaff, isAdmin, status, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl max-w-md w-full p-8 text-center border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {status !== 'active'
              ? `Tu cuenta se encuentra actualmente ${status}. Contacta con el equipo de soporte.`
              : 'Esta área es exclusiva para el personal autorizado (Moderadores y Administradores de TotalAnime).'}
          </p>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 rounded-xl transition duration-150"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl max-w-md w-full p-8 text-center border-amber-500/20">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Privilegios de Administrador Requeridos</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Esta sección solo está disponible para usuarios con el rol de <strong>Administrador</strong>.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition duration-150"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
