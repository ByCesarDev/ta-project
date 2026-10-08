import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useSeriesCatalog } from '../hooks/useSeries.js';
import { useGenres } from '../hooks/useAnime.js';
import { AnimeCard } from '../components/common/AnimeCard.js';
import { AnimeCardSkeleton } from '../components/common/Skeleton.js';
import { DropdownSelect } from '../components/common/DropdownSelect.js';
import { Search, SlidersHorizontal, Film } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [format, setFormat] = useState(searchParams.get('format') || '');
  const [sortBy, setSortBy] = useState<'views' | 'recent' | 'name' | 'episodes'>(
    (searchParams.get('sort') as any) || 'views'
  );

  const { data: genresData } = useGenres();

  // Sync state with URL params
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const genreParam = searchParams.get('genre') || '';
    const statusParam = searchParams.get('status') || 'all';
    setSearch(qParam);
    setSelectedGenre(genreParam);
    setStatus(statusParam);
  }, [searchParams]);

  const updateFilters = (newParams: Record<string, string>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v && v !== 'all') updated.set(k, v);
      else updated.delete(k);
    });
    setSearchParams(updated);
  };

  const { data: catalogResult, isLoading } = useSeriesCatalog({
    search,
    genreSlug: selectedGenre,
    status,
    format,
    sortBy,
  });

  const seriesList = catalogResult?.series || [];
  const totalCount = catalogResult?.total || 0;

  return (
    <PageContainer>
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-indigo-500" />
          Directorio de Series
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explora nuestro catálogo completo de series de anime con selector unificado de temporadas, películas y OVAs.
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
              placeholder="Buscar por título o serie..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateFilters({ q: e.target.value });
              }}
              className="glass-input w-full pl-10 text-xs py-2"
            />
          </div>

          {/* Status Dropdown */}
          <DropdownSelect
            value={status}
            onChange={(val) => {
              const str = String(val);
              setStatus(str);
              updateFilters({ status: str });
            }}
            options={[
              { value: 'all', label: 'Todos los Estados' },
              { value: 'emision', label: 'En Emisión', badge: 'Activo' },
              { value: 'finalizado', label: 'Finalizado', badge: 'Completo' },
              { value: 'proximamente', label: 'Próximamente', badge: 'Próximo' },
            ]}
          />

          {/* Format Dropdown */}
          <DropdownSelect
            value={format}
            onChange={(val) => {
              const str = String(val);
              setFormat(str);
              updateFilters({ format: str });
            }}
            options={[
              { value: '', label: 'Todos los Formatos' },
              { value: 'TV', label: 'Series TV' },
              { value: 'MOVIE', label: 'Películas' },
              { value: 'OVA', label: 'OVAs' },
              { value: 'ONA', label: 'ONAs' },
            ]}
          />

          {/* Sorting Dropdown */}
          <DropdownSelect
            value={sortBy}
            onChange={(val) => {
              const str = val as 'views' | 'recent' | 'name' | 'episodes';
              setSortBy(str);
              updateFilters({ sort: str });
            }}
            options={[
              { value: 'views', label: 'Más Vistos' },
              { value: 'recent', label: 'Recién Agregados' },
              { value: 'name', label: 'Título (A-Z)' },
              { value: 'episodes', label: 'Más Episodios' },
            ]}
          />
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
          Mostrando <strong className="text-white">{seriesList.length}</strong> de{' '}
          <strong className="text-white">{totalCount}</strong> series encontradas
        </span>
      </div>

      {/* Series Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0c101c] border border-slate-800/80">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base font-['Outfit'] mb-1">
            No se encontraron series
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prueba ajustando los filtros de búsqueda o seleccionando otro género.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {seriesList.map((item) => (
            <AnimeCard key={item.id} anime={item} />
          ))}
        </div>
      )}
    </PageContainer>
  );
};
