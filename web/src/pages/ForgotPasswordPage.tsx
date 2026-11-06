import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/common/Button.js';
import { Tv, Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Por favor introduce tu dirección de correo electrónico.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || 'No se pudo enviar el correo de recuperación.');
    } else {
      setSuccessMsg(
        '¡Enlace enviado! Hemos remitido las instrucciones a tu correo electrónico para que restablezcas tu contraseña.'
      );
      setEmail('');
    }
  };

  return (
    <PageContainer>
      <div className="py-12 sm:py-16 flex items-center justify-center">
        <div className="glass-panel max-w-md w-full rounded-3xl p-8 sm:p-10 border border-slate-800/80 shadow-2xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              Recuperar Contraseña
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Introduce el correo asociado a tu cuenta de TotalAnime
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="glass-input w-full pl-11 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Enviar Instrucciones
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
