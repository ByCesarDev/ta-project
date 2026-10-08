import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Merge, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { apiClient } from '../../lib/api.js';
import { Series } from '../../types/index.js';

interface CombineSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSeries: Series | null;
  onSuccess?: () => void;
}

export const CombineSeriesModal: React.FC<CombineSeriesModalProps> = ({
  isOpen,
  onClose,
  sourceSeries,
  onSuccess,
}) => {
  const [targetSeriesId, setTargetSeriesId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // List candidate target series
  const { data: allSeries, isLoading } = useQuery({
    queryKey: ['admin-combine-series-list', searchQuery],
    queryFn: async () => {
      const { data } = await apiClient.get('/series', {
        params: { search: searchQuery.trim(), limit: 15 },
      });
      return (data.series || []) as Series[];
    },
    enabled: isOpen && !!sourceSeries,
  });

  const candidates = allSeries?.filter((s) => s.id !== sourceSeries?.id) || [];

  const handleCombine = async () => {
    if (!sourceSeries || !targetSeriesId) return;

    if (
      !confirm(
        `¿Confirmas fusionar "${sourceSeries.name}" dentro de la serie destino? Todas sus temporadas y favoritos se transferirán, y su slug "${sourceSeries.slug}" redirigirá permanentemente.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/series/combine', {
        sourceSeriesId: sourceSeries.id,
        targetSeriesId,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al combinar series';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !sourceSeries) return null;

  const selectedTarget = candidates.find((s) => s.id === targetSeriesId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Merge className="w-5 h-5 text-amber-400" />
          Fusionar y Combinar Series
        </span>
      }
      subtitle="Une dos series en una sola. Transfiere temporadas, unifica favoritos y genera redirecciones de URL automáticas."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Source and Target Comparison View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Source Box */}
          <div className="glass-card rounded-xl p-4 border border-rose-500/30 space-y-2">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              Serie de Origen (Será Absorbida)
            </span>
            <div className="flex items-center gap-3">
              {sourceSeries.cover_image && (
                <img
                  src={sourceSeries.cover_image}
                  alt={sourceSeries.name}
                  className="w-12 h-16 object-cover rounded-lg shrink-0 border border-slate-700"
                />
              )}
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{sourceSeries.name}</h4>
                <p className="text-xs text-slate-400 font-mono truncate">{sourceSeries.slug}</p>
                <Badge variant="warning" size="sm" className="mt-1">
                  Se convertirá en Alias
                </Badge>
              </div>
            </div>
          </div>

          {/* Target Box */}
          <div className="glass-card rounded-xl p-4 border border-emerald-500/30 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Serie de Destino (Principal)
            </span>
            {selectedTarget ? (
              <div className="flex items-center gap-3">
                {selectedTarget.cover_image && (
                  <img
                    src={selectedTarget.cover_image}
                    alt={selectedTarget.name}
                    className="w-12 h-16 object-cover rounded-lg shrink-0 border border-slate-700"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{selectedTarget.name}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">{selectedTarget.slug}</p>
                  <Badge variant="success" size="sm" className="mt-1">
                    Recibirá las temporadas
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Selecciona una serie de la lista inferior...
              </p>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong>Acción Atómica e Irreversible:</strong> Todas las temporadas de la serie origen se añadirán al final del selector de temporadas de la serie destino. Las URLs anteriores seguirán funcionando mediante la tabla de alias.
          </div>
        </div>

        {/* Select Target Series */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Buscar y Seleccionar Serie de Destino
          </label>
          <input
            type="text"
            placeholder="Buscar por título de serie destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full text-xs"
          />

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                Buscando series...
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setTargetSeriesId(s.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                    targetSeriesId === s.id
                      ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg'
                      : 'glass-card border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {s.cover_image && (
                      <img
                        src={s.cover_image}
                        alt={s.name}
                        className="w-9 h-12 object-cover rounded shrink-0 border border-slate-700"
                      />
                    )}
                    <div className="min-w-0">
                      <h5 className="font-semibold text-white text-xs truncate">{s.name}</h5>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{s.slug}</p>
                    </div>
                  </div>

                  {targetSeriesId === s.id && (
                    <Badge variant="primary" size="sm">
                      <Check className="w-3 h-3 mr-1" /> Seleccionada
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No se encontraron otras series para combinar.
              </p>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!targetSeriesId || isSubmitting}
            isLoading={isSubmitting}
            icon={<Merge className="w-4 h-4" />}
            onClick={handleCombine}
          >
            Ejecutar Fusión Transaccional
          </Button>
        </div>
      </div>
    </Modal>
  );
};
