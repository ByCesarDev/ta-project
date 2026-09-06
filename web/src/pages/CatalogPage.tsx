import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useAnimeCatalog, useGenres } from '../hooks/useAnime.js';
import { AnimeCard } from '../components/common/AnimeCard.js';
import { AnimeCardSkeleton } from '../components/common/Skeleton.js';
import { Search, SlidersHorizontal, Film } from 'lucide-react';
import { normalizeAnimeStatus } from '../lib/utils.js';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [status, setStatus] = useState(normalizeAnimeStatus(searchParams.get('status') || ''));
  const [format, setFormat] = useState(searchParams.get('format') || '');
  const [sortBy, setSortBy] = useState<'views' | 'recent' | 'name' | 'episodes'>(
    (searchParams.get('sort') as any) || 'views'
  );

  const { data: genresData } = useGenres();

  // Sync state with URL params
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const genreParam = searchParams.get('genre') || '';
    const statusParam = normalizeAnimeStatus(searchParams.get('status') || '');
    setSearch(qParam);
    setSelectedGenre(genreParam);
    setStatus(statusParam);
  }, [searchParams]);

  const updateFilters = (newParams: Record<string, string>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) updated.set(k, v);
      else updated.delete(k);
    });
    setSearchParams(updated);
  };

  const { data: catalogResult, isLoading } = useAnimeCatalog({
    search,
    genreSlug: selectedGenre,
    status,
    format,
    sortBy,
  });

  const animes = catalogResult?.animes || [];
  const totalCount = catalogResult?.totalCount || 0;

  return (
    <PageContainer>
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-indigo-500" />
          Directorio de Animes
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explora nuestro catálogo completo con filtros avanzados por género, formato y estado.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800/80 mb-8 space-y-4 shadow-xl">
        {/* Search Input & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateFilters({ q: e.target.value });
              }}
              className="glass-input w-full pl-10 text-xs py-2"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              updateFilters({ status: e.target.value });
            }}
            className="glass-input text-xs py-2"
          >
            <option value="">Todos los Estados</option>
            <option value="RELEASING">En Emisión</option>
            <option value="FINISHED">Finalizado</option>
            <option value="NOT_YET_RELEASED">Próximamente</option>
          </select>

          {/* Format Dropdown */}
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              updateFilters({ format: e.target.value });
            }}
            className="glass-input text-xs py-2"
          >
            <option value="">Todos los Formatos</option>
            <option value="TV">Series TV</option>
            <option value="MOVIE">Películas</option>
            <option value="OVA">OVA</option>
            <option value="ONA">ONA</option>
          </select>

          {/* Sorting Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              const val = e.target.value as any;
              setSortBy(val);
              updateFilters({ sort: val });
            }}
            className="glass-input text-xs py-2"
          >
            <option value="views">Más Vistos</option>
            <option value="recent">Recién Agregados</option>
            <option value="name">Título (A-Z)</option>
            <option value="episodes">Más Episodios</option>
          </select>
        </div>

        {/* Genre Pills */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold shrink-0 mr-1 flex items-center gap-1 font-['Outfit']">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Género:
            </span>

            <button
              onClick={() => {
                setSelectedGenre('');
                updateFilters({ genre: '' });
              }}
              className={`px-3 py-1 rounded-xl font-medium shrink-0 transition-all border ${
                selectedGenre === ''
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              Todos
            </button>

            {genresData?.map((genre) => {
              const isSelected = selectedGenre === genre.slug;
              return (
                <button
                  key={genre.id}
                  onClick={() => {
                    const next = isSelected ? '' : genre.slug;
                    setSelectedGenre(next);
                    updateFilters({ genre: next });
                  }}
                  className={`px-3 py-1 rounded-xl font-medium shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
        <span>
          Mostrando <strong className="text-white">{animes.length}</strong> de{' '}
          <strong className="text-white">{totalCount}</strong> animes encontrados
        </span>
      </div>

      {/* Anime Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : animes.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0c101c] border border-slate-800/80">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base font-['Outfit'] mb-1">
            No se encontraron animes
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prueba ajustando los filtros de búsqueda o seleccionando otro género.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {animes.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </PageContainer>
  );
};
