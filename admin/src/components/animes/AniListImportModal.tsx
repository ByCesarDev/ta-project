import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Plus, Check } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { apiClient } from '../../lib/api.js';
import { AniListSearchResult } from '../../types/index.js';

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

  const handleImport = async (anilistId: number) => {
    setImportingId(anilistId);
    setErrorMsg(null);

    try {
      await apiClient.post('/anilist/import', {
        anilistId,
        autoCreateEpisodes: true,
      });

      setImportedIds((prev) => [...prev, anilistId]);
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
      subtitle="Busca cualquier anime para importar metadatos oficiales, portadas y episodios con 1 clic."
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
              placeholder="Ej: Jujutsu Kaisen, Solo Leveling, Bleach..."
              className="glass-input w-full pl-11"
              autoFocus
            />
          </div>
          <Button type="submit" isLoading={isSearching} icon={<Search className="w-4 h-4" />}>
            Buscar
          </Button>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Results Grid */}
        {isSearching ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Consultando AniList GraphQL API...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {results.map((media) => {
              const title = media.title.english || media.title.romaji || media.title.native || 'Sin título';
              const cover = media.coverImage?.large || media.coverImage?.extraLarge;
              const isImported = importedIds.includes(media.id);
              const isCurrentImporting = importingId === media.id;

              return (
                <div
                  key={media.id}
                  className="glass-card rounded-xl p-4 flex gap-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all"
                >
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

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
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
                    </div>

                    <div className="mt-3">
                      {isImported ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" /> Importado con éxito
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          isLoading={isCurrentImporting}
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => handleImport(media.id)}
                        >
                          Importar 1-Clic
                        </Button>
                      )}
                    </div>
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
      </div>
    </Modal>
  );
};
