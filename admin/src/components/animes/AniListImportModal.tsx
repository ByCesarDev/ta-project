import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Sparkles, Plus, Check, Layers, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { apiClient } from '../../lib/api.js';
import { AniListSearchResult, Series } from '../../types/index.js';

interface AniListImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const AniListImportModal: React.FC<AniListImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AniListSearchResult['media']>([]);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [importedIds, setImportedIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Binding configuration modal for a selected AniList item
  const [selectedMediaForBinding, setSelectedMediaForBinding] = useState<any | null>(null);
  const [importMode, setImportMode] = useState<'new_series' | 'existing_series'>('new_series');
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [seasonMode, setSeasonMode] = useState<'new_season' | 'existing_season'>('new_season');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [newSeasonName, setNewSeasonName] = useState('Temporada 1');
  const [partLabel, setPartLabel] = useState('');
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('');

  // Search candidate series if binding to existing
  const { data: candidateSeries } = useQuery({
    queryKey: ['admin-candidate-series', seriesSearchQuery],
    queryFn: async () => {
      const { data } = await apiClient.get('/series', {
        params: { search: seriesSearchQuery.trim(), limit: 10 },
      });
      return (data.series || []) as Series[];
    },
    enabled: isOpen && importMode === 'existing_series',
  });

  // Fetch full details of the selected series for seasons list
  const { data: selectedSeriesDetail } = useQuery({
    queryKey: ['admin-selected-series-seasons', selectedSeriesId],
    queryFn: async () => {
      if (!selectedSeriesId) return null;
      const seriesObj = candidateSeries?.find((s) => s.id === selectedSeriesId);
      if (!seriesObj?.slug) return null;
      const { data } = await apiClient.get(`/series/${seriesObj.slug}`);
      return data;
    },
    enabled: !!selectedSeriesId,
  });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const { data } = await apiClient.get<AniListSearchResult>('/anilist/search', {
        params: { q: query.trim(), perPage: 8 },
      });
      setResults(data.media || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al buscar en AniList';
      setErrorMsg(message);
    } finally {
      setIsSearching(false);
    }
  };

  const openBindingModal = (media: any) => {
    setSelectedMediaForBinding(media);
    setImportMode('new_series');
    setSelectedSeriesId(null);
    setSelectedSeasonId(null);
    setNewSeasonName('Temporada 1');
    setPartLabel('');
    setSeriesSearchQuery(media.title.english || media.title.romaji || '');
  };

  const executeTransactionalImport = async () => {
    if (!selectedMediaForBinding) return;

    setImportingId(selectedMediaForBinding.id);
    setErrorMsg(null);

    try {
      const title =
        selectedMediaForBinding.title.english ||
        selectedMediaForBinding.title.romaji ||
        selectedMediaForBinding.title.native ||
        'Sin título';
      const cover =
        selectedMediaForBinding.coverImage?.extraLarge ||
        selectedMediaForBinding.coverImage?.large;
      const banner = selectedMediaForBinding.bannerImage || null;

      // Extract anime fields from AniList media
      const animeData = {
        name: title,
        title_romaji: selectedMediaForBinding.title.romaji || null,
        title_english: selectedMediaForBinding.title.english || null,
        title_native: selectedMediaForBinding.title.native || null,
        cover_image: cover || null,
        banner_image: banner || null,
        status: selectedMediaForBinding.status?.toLowerCase() || 'finished',
        episodes: selectedMediaForBinding.episodes || 0,
        description: selectedMediaForBinding.description || null,
        anilist_id: selectedMediaForBinding.id,
        season_year: selectedMediaForBinding.seasonYear || null,
        format: selectedMediaForBinding.format || 'TV',
        slug:
          selectedMediaForBinding.title.romaji
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') ||
          `anime-${selectedMediaForBinding.id}`,
      };

      await apiClient.post('/series/import-anilist', {
        seriesOption: importMode === 'new_series' ? 'new' : 'existing',
        seriesId: selectedSeriesId,
        newSeriesData:
          importMode === 'new_series'
            ? {
                name: title,
                cover_image: cover || undefined,
                banner_image: banner || undefined,
                description: selectedMediaForBinding.description || undefined,
              }
            : undefined,
        seasonOption:
          importMode === 'new_series'
            ? 'new'
            : seasonMode === 'new_season'
            ? 'new'
            : 'existing',
        seasonId: selectedSeasonId,
        newSeasonData: {
          name: newSeasonName.trim() || 'Temporada 1',
          season_number: 1,
          kind: 'season',
        },
        partLabel: partLabel.trim() || undefined,
        animeData,
      });

      setImportedIds((prev) => [...prev, selectedMediaForBinding.id]);
      setSelectedMediaForBinding(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error durante la importación';
      setErrorMsg(message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Importador Inteligente desde AniList
        </span>
      }
      subtitle="Busca cualquier entrega en AniList y agrúpala como Nueva Serie o dentro de una Serie existente."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Jujutsu Kaisen, Demon Slayer, Attack on Titan..."
              className="glass-input w-full pl-11"
              autoFocus
            />
          </div>
          <Button type="submit" isLoading={isSearching} icon={<Search className="w-4 h-4" />}>
            Buscar
          </Button>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Grid */}
        {isSearching ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Consultando AniList GraphQL API...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
            {results.map((media) => {
              const title = media.title.english || media.title.romaji || media.title.native || 'Sin título';
              const cover = media.coverImage?.large || media.coverImage?.extraLarge;
              const isImported = importedIds.includes(media.id);
              const isCurrentImporting = importingId === media.id;
              const relations = media.relations?.edges || [];

              return (
                <div
                  key={media.id}
                  className="glass-card rounded-xl p-4 flex gap-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex-col justify-between"
                >
                  <div className="flex gap-3">
                    {cover ? (
                      <img
                        src={cover}
                        alt={title}
                        className="w-20 h-28 object-cover rounded-lg shrink-0 border border-slate-700/80"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-slate-800 rounded-lg shrink-0 flex items-center justify-center text-xs text-slate-500">
                        Sin Cover
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm line-clamp-1">{title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {media.title.romaji !== title ? media.title.romaji : media.title.native}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {media.format && <Badge size="sm">{media.format}</Badge>}
                        {media.episodes && (
                          <Badge variant="primary" size="sm">
                            {media.episodes} eps
                          </Badge>
                        )}
                        {media.seasonYear && <Badge size="sm">{media.seasonYear}</Badge>}
                      </div>

                      {/* Relations info if any */}
                      {relations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {relations.slice(0, 2).map((rel: any, rIdx: number) => (
                            <span
                              key={rIdx}
                              className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                            >
                              {rel.relationType}: {rel.node?.title?.romaji || rel.node?.title?.english}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-end">
                    {isImported ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" /> Importado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        isLoading={isCurrentImporting}
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => openBindingModal(media)}
                      >
                        Configurar e Importar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : query ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No se encontraron resultados para &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            Escribe el nombre de un anime para comenzar la búsqueda.
          </div>
        )}

        {/* Modal Secondary: Binding Destination Selector */}
        {selectedMediaForBinding && (
          <div className="p-5 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Vincular &ldquo;
                {selectedMediaForBinding.title.english ||
                  selectedMediaForBinding.title.romaji}
                &rdquo;
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMediaForBinding(null)}
              >
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Create as New Series */}
              <div
                onClick={() => setImportMode('new_series')}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  importMode === 'new_series'
                    ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'new_series'}
                    onChange={() => setImportMode('new_series')}
                    className="text-indigo-500"
                  />
                  <h4 className="text-xs font-bold text-white">Crear como Nueva Serie</h4>
                </div>
                <p className="text-[11px] text-slate-400 pl-5">
                  Crea una nueva ficha de Serie con este anime como Temporada 1.
                </p>
              </div>

              {/* Option 2: Add to Existing Series */}
              <div
                onClick={() => setImportMode('existing_series')}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  importMode === 'existing_series'
                    ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'existing_series'}
                    onChange={() => setImportMode('existing_series')}
                    className="text-indigo-500"
                  />
                  <h4 className="text-xs font-bold text-white">Añadir a Serie Existente</h4>
                </div>
                <p className="text-[11px] text-slate-400 pl-5">
                  Agrega como Temporada 2, OVA, Película o Parte (Split-Cour) de una serie existente.
                </p>
              </div>
            </div>

            {/* Existing Series Configuration */}
            {importMode === 'existing_series' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    1. Buscar Serie de Destino
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar serie existente..."
                    value={seriesSearchQuery}
                    onChange={(e) => setSeriesSearchQuery(e.target.value)}
                    className="glass-input w-full text-xs"
                  />

                  <div className="max-h-32 overflow-y-auto mt-2 space-y-1.5">
                    {candidateSeries?.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSeriesId(s.id)}
                        className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between border ${
                          selectedSeriesId === s.id
                            ? 'bg-indigo-500/20 border-indigo-500/60 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="font-semibold truncate">{s.name}</span>
                        {selectedSeriesId === s.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSeriesId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        2. Temporada de Destino
                      </label>
                      <select
                        value={selectedSeasonId || 'new'}
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            setSeasonMode('new_season');
                            setSelectedSeasonId(null);
                          } else {
                            setSeasonMode('existing_season');
                            setSelectedSeasonId(Number(e.target.value));
                          }
                        }}
                        className="glass-input w-full text-xs bg-[#0b0f19]"
                      >
                        <option value="new">+ Crear Nueva Temporada</option>
                        {selectedSeriesDetail?.seasons?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.kind})
                          </option>
                        ))}
                      </select>
                    </div>

                    {seasonMode === 'new_season' ? (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Nombre de la Nueva Temporada
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Temporada 2, Película..."
                          value={newSeasonName}
                          onChange={(e) => setNewSeasonName(e.target.value)}
                          className="glass-input w-full text-xs"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Etiqueta de Parte (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Parte 1, Parte 2..."
                          value={partLabel}
                          onChange={(e) => setPartLabel(e.target.value)}
                          className="glass-input w-full text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMediaForBinding(null)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={importMode === 'existing_series' && !selectedSeriesId}
                isLoading={importingId === selectedMediaForBinding.id}
                onClick={executeTransactionalImport}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Ejecutar Importación Transaccional
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
