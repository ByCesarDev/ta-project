import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Tv,
  Cpu,
  Trash2,
  ArrowRightLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { apiClient } from '../../lib/api.js';
import { Series, SeasonKind } from '../../types/index.js';
import { ScrapeAnimeModal } from '../animes/ScrapeAnimeModal.js';
import { Link } from 'react-router-dom';

interface SeriesSeasonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series | null;
  onSuccess?: () => void;
}

export const SeriesSeasonsModal: React.FC<SeriesSeasonsModalProps> = ({
  isOpen,
  onClose,
  series,
  onSuccess,
}) => {
  const [isAddingSeason, setIsAddingSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonKind, setNewSeasonKind] = useState<SeasonKind>('season');
  const [newSeasonNumber, setNewSeasonNumber] = useState<number | undefined>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reassign / Move modal state
  const [reassigningEntry, setReassigningEntry] = useState<{
    id: number;
    animeName: string;
    currentSeasonId: number;
  } | null>(null);
  const [targetSeasonId, setTargetSeasonId] = useState<number | null>(null);
  const [partLabel, setPartLabel] = useState<string>('');

  // Scrape modal for individual anime entry
  const [selectedAnimeToScrape, setSelectedAnimeToScrape] = useState<any | null>(null);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);

  // Fetch full series with seasons and entries
  const { data: fullSeries, isLoading, refetch } = useQuery({
    queryKey: ['admin-series-detail', series?.id],
    queryFn: async () => {
      if (!series?.slug) return null;
      const { data } = await apiClient.get(`/series/${series.slug}`);
      return data;
    },
    enabled: isOpen && !!series?.slug,
  });

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!series || !newSeasonName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient.post(`/series/${series.id}/seasons`, {
        name: newSeasonName.trim(),
        season_number: newSeasonNumber,
        kind: newSeasonKind,
      });

      setIsAddingSeason(false);
      setNewSeasonName('');
      refetch();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear temporada';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeason = async (seasonId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta temporada y sus vínculos?')) return;
    setErrorMsg(null);

    try {
      await apiClient.delete(`/series/seasons/${seasonId}`, {
        params: { cascade: true },
      });
      refetch();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar temporada.';
      setErrorMsg(msg);
    }
  };

  const handleDeleteEntry = async (entryId: number, animeName: string) => {
    if (!confirm(`¿Desvincular "${animeName}" de esta temporada?`)) return;
    setErrorMsg(null);

    try {
      await apiClient.delete(`/series/entries/${entryId}`);
      refetch();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desvincular entrega.';
      setErrorMsg(msg);
    }
  };

  const handleReassignEntry = async () => {
    if (!reassigningEntry || !targetSeasonId) return;
    setErrorMsg(null);

    try {
      await apiClient.post(`/series/entries/${reassigningEntry.id}/reassign`, {
        targetSeasonId,
        partLabel: partLabel.trim() || null,
      });

      setReassigningEntry(null);
      setTargetSeasonId(null);
      setPartLabel('');
      refetch();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reasignar entrega';
      setErrorMsg(msg);
    }
  };

  const handlePromoteEntry = async (entryId: number, animeName: string) => {
    if (!confirm(`¿Promover "${animeName}" a una Serie independiente? Se creará una nueva Serie con este anime como Temporada 1.`)) {
      return;
    }

    try {
      await apiClient.post(`/series/entries/${entryId}/promote`, {
        name: animeName,
      });

      refetch();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al promover entrega a serie independiente';
      setErrorMsg(msg);
    }
  };

  if (!isOpen || !series) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Temporadas y Entregas: {series.name}
        </span>
      }
      subtitle="Estructura Crunchyroll: organiza temporadas, partes (Split-Cour), películas y entregas de AniList."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="purple">
              {fullSeries?.seasons?.length || 0} Temporadas
            </Badge>
            <Badge variant="default">
              {fullSeries?.total_episodes_count || 0} Episodios Totales
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddingSeason(true)}
          >
            Nueva Temporada
          </Button>
        </div>

        {/* Add Season Inline Form */}
        {isAddingSeason && (
          <form
            onSubmit={handleCreateSeason}
            className="p-4 rounded-xl glass-card border border-indigo-500/30 space-y-3"
          >
            <h4 className="text-sm font-semibold text-white">Añadir Nueva Temporada / Sección</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Nombre Visible</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Temporada 2, Película: Mugen Train..."
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Nº Temp</label>
                <input
                  type="number"
                  min="1"
                  value={newSeasonNumber || ''}
                  onChange={(e) => setNewSeasonNumber(e.target.value ? Number(e.target.value) : undefined)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                <select
                  value={newSeasonKind}
                  onChange={(e) => setNewSeasonKind(e.target.value as SeasonKind)}
                  className="glass-input w-full text-xs bg-[#0b0f19]"
                >
                  <option value="season">Temporada (TV)</option>
                  <option value="movie">Película</option>
                  <option value="special">Especial</option>
                  <option value="ova">OVA</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingSeason(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Crear Temporada
              </Button>
            </div>
          </form>
        )}

        {/* Seasons List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Cargando temporadas...
          </div>
        ) : fullSeries?.seasons && fullSeries.seasons.length > 0 ? (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {fullSeries.seasons.map((season: any, sIdx: number) => (
              <div
                key={season.id}
                className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3"
              >
                {/* Season Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">
                      #{sIdx + 1}
                    </span>
                    <h3 className="font-bold text-white text-sm">
                      {season.name}
                    </h3>
                    <Badge size="sm" variant="purple">
                      {season.kind === 'movie'
                        ? 'Película'
                        : season.kind === 'special'
                        ? 'Especial'
                        : season.kind === 'ova'
                        ? 'OVA'
                        : 'Temporada'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-400 hover:text-rose-300" />}
                      onClick={() => handleDeleteSeason(season.id)}
                      title="Eliminar Temporada (debe estar vacía)"
                    />
                  </div>
                </div>

                {/* Entries under this season */}
                {season.series_entries && season.series_entries.length > 0 ? (
                  <div className="space-y-2 pl-4 border-l-2 border-indigo-500/30">
                    {season.series_entries.map((entry: any) => {
                      const anime = entry.anime;
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {anime?.cover_image ? (
                              <img
                                src={anime.cover_image}
                                alt={anime?.name}
                                className="w-9 h-12 object-cover rounded shrink-0 border border-slate-700/60"
                              />
                            ) : (
                              <div className="w-9 h-12 bg-slate-800 rounded shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-white truncate">
                                  {anime?.name || `Anime ID ${entry.anime_id}`}
                                </h4>
                                {entry.part_label && (
                                  <Badge size="sm" variant="success">
                                    {entry.part_label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {Array.isArray(anime?.episodes)
                                  ? anime.episodes.length
                                  : typeof anime?.episodes === 'number'
                                  ? anime.episodes
                                  : 0}{' '}
                                eps • AniList #{anime?.anilist_id || 'N/A'} • {anime?.status}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Manage Episodes */}
                            {anime?.id && (
                              <Link to={`/animes/${anime.id}/episodes`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Tv className="w-3 h-3" />}
                                  title="Gestionar Episodios y Servidores"
                                >
                                  Episodios
                                </Button>
                              </Link>
                            )}

                            {/* Scrape */}
                            {anime && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<Cpu className="w-3 h-3 text-amber-400" />}
                                onClick={() => {
                                  setSelectedAnimeToScrape(anime);
                                  setIsScrapeModalOpen(true);
                                }}
                                title="Scrapear Fuentes para esta entrega"
                              >
                                Scrape
                              </Button>
                            )}

                            {/* Move / Reassign */}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 hover:text-white" />}
                              onClick={() => {
                                setReassigningEntry({
                                  id: entry.id,
                                  animeName: anime?.name || `Entrega #${entry.id}`,
                                  currentSeasonId: season.id,
                                });
                                setTargetSeasonId(season.id);
                                setPartLabel(entry.part_label || '');
                              }}
                              title="Mover a otra temporada o etiquetar parte"
                            />

                            {/* Promote to Independent Series */}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-300" />}
                              onClick={() => handlePromoteEntry(entry.id, anime?.name || 'Serie')}
                              title="Separar y convertir en Serie independiente"
                            />

                            {/* Delete / Unbind Entry */}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-3.5 h-3.5 text-rose-400 hover:text-rose-300" />}
                              onClick={() => handleDeleteEntry(entry.id, anime?.name || 'Entrega')}
                              title="Desvincular esta entrega"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic pl-4">
                    Sin entregas vinculadas. Importa desde AniList o mueve una entrega aquí.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            Esta serie aún no tiene temporadas configuradas.
          </div>
        )}

        {/* Reassign / Edit Part Modal Inline */}
        {reassigningEntry && (
          <div className="p-4 rounded-xl bg-slate-900/95 border border-indigo-500/40 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              Reasignar Entrega: {reassigningEntry.animeName}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Temporada de Destino</label>
                <select
                  value={targetSeasonId || ''}
                  onChange={(e) => setTargetSeasonId(Number(e.target.value))}
                  className="glass-input w-full text-xs bg-[#0b0f19]"
                >
                  {fullSeries?.seasons?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.kind})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Etiqueta de Parte (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Parte 1, Parte 2, Cour 2..."
                  value={partLabel}
                  onChange={(e) => setPartLabel(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReassigningEntry(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleReassignEntry}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}

        {/* Scrape Modal for child anime */}
        {selectedAnimeToScrape && (
          <ScrapeAnimeModal
            isOpen={isScrapeModalOpen}
            onClose={() => {
              setIsScrapeModalOpen(false);
              setSelectedAnimeToScrape(null);
            }}
            anime={selectedAnimeToScrape}
            onSuccess={() => refetch()}
          />
        )}
      </div>
    </Modal>
  );
};
