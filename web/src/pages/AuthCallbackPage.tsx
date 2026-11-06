import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/common/Button.js';
import { Tv, Lock, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();

  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Verificando credenciales...');

  useEffect(() => {
    // Check if URL or hash indicates a recovery flow
    const type = searchParams.get('type');
    const hash = window.location.hash;

    if (type === 'recovery' || hash.includes('type=recovery')) {
      setIsRecovery(true);
      return;
    }

    // Normal email confirmation flow
    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setStatusText('¡Sesión verificada! Redirigiendo a TotalAnime...');
        setTimeout(() => navigate('/', { replace: true }), 1000);
      } else {
        setStatusText('Listo. Redirigiendo a la pantalla de acceso...');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await updatePassword(newPassword);
    setIsUpdating(false);

    if (error) {
      setErrorMsg(error.message || 'Error al actualizar la contraseña.');
    } else {
      setSuccessMsg('¡Contraseña actualizada exitosamente! Redirigiendo...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    }
  };

  return (
    <PageContainer>
      <div className="py-12 sm:py-16 flex items-center justify-center">
        <div className="glass-panel max-w-md w-full rounded-3xl p-8 sm:p-10 border border-slate-800/80 shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              {isRecovery ? 'Establecer Nueva Contraseña' : 'Autenticación'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRecovery ? 'Elige tu nueva clave de acceso para TotalAnime' : statusText}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="glass-input w-full pl-11 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="glass-input w-full pl-11 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isUpdating}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Guardar Contraseña
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">{statusText}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
