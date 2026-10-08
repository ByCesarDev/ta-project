import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { apiClient } from '../../lib/api.js';
import { ShieldCheck, AlertTriangle, Key, ExternalLink, Loader2, Sparkles, Check, RefreshCw } from 'lucide-react';

interface CloudflareManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (hasClearance: boolean) => void;
}

export const CloudflareManagerModal: React.FC<CloudflareManagerModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [hasClearance, setHasClearance] = useState<boolean>(false);
  const [clearanceData, setClearanceData] = useState<any>(null);
  const [manualCookie, setManualCookie] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/jobs/cloudflare/status');
      setHasClearance(res.data?.hasClearance || false);
      setClearanceData(res.data?.clearance || null);
      if (res.data?.clearance?.cookie) {
        setManualCookie(res.data.clearance.cookie);
      }
      onStatusChange?.(res.data?.hasClearance || false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      fetchStatus();
    }
  }, [isOpen]);

  const handleAutoSolve = async () => {
    try {
      setIsSolving(true);
      setFeedback(null);
      const res = await apiClient.post('/jobs/cloudflare/solve');
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: '¡Verificación completada con éxito! La sesión de Cloudflare fue guardada.',
        });
        await fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: res.data?.message || 'No se pudo resolver la verificación de Cloudflare.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error al lanzar el verificador.',
      });
    } finally {
      setIsSolving(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCookie.trim()) return;

    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await apiClient.post('/jobs/cloudflare/save', {
        cookie: manualCookie.trim(),
      });
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Cookie cf_clearance guardada exitosamente.',
      });
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error al guardar la cookie.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Gestor de Sesión Cloudflare (Cluster)
            </h3>
          </div>
        </div>
      }
      subtitle="Sincroniza la cookie cf_clearance para que el scraper descargue todos los animes sin bloqueos"
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Status Pill Card */}
        <div className="p-4 rounded-2xl bg-[#080c16] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasClearance ? (
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Estado:
                {hasClearance ? (
                  <span className="text-emerald-400 font-semibold">🟢 Sesión Activa</span>
                ) : (
                  <span className="text-amber-400 font-semibold">🟡 Requiere Sincronización</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasClearance && clearanceData?.updatedAt
                  ? `Actualizado: ${new Date(clearanceData.updatedAt).toLocaleString()}`
                  : 'Sin cookie de bypass registrada. El scraping fallará en los 8 mirrors.'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refrescar estado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Option 1: Automatic 1-Click Verification */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Opción A: Verificador Automático en 1 Clic
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Abre una pequeña ventana de Chrome por unos segundos. Si aparece la casilla de Cloudflare Turnstile, la resuelves y el sistema guardará el token automáticamente.
          </p>
          <button
            onClick={handleAutoSolve}
            disabled={isSolving}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Esperando verificación en ventana Chrome...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Lanzar Verificador en Chrome
              </>
            )}
          </button>
        </div>

        {/* Option 2: Manual Cookie Input */}
        <form onSubmit={handleManualSave} className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              Opción B: Pegar Cookie <code className="text-indigo-400 font-mono">cf_clearance</code> Manualmente
            </label>
            <a
              href="https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Abrir Mirror <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <textarea
            value={manualCookie}
            onChange={(e) => setManualCookie(e.target.value)}
            placeholder="Pega el valor de tu cookie cf_clearance..."
            rows={3}
            className="w-full bg-[#050811] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />

          <button
            type="submit"
            disabled={isSaving || !manualCookie.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar Cookie de Clearance
          </button>
        </form>
      </div>
    </Modal>
  );
};
