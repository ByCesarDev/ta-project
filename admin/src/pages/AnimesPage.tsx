import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Plus,
  Tv,
  Edit2,
  Cpu,
  Eye,
  Layers,
  Merge,
  Trash2,
  Film,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Table, Column } from '../components/common/Table.js';
import { DropdownSelect } from '../components/common/DropdownSelect.js';
import { AniListImportModal } from '../components/animes/AniListImportModal.js';
import { AnimeFormModal } from '../components/animes/AnimeFormModal.js';
import { ScrapeAnimeModal } from '../components/animes/ScrapeAnimeModal.js';
import { SeriesSeasonsModal } from '../components/series/SeriesSeasonsModal.js';
import { CombineSeriesModal } from '../components/series/CombineSeriesModal.js';
import { SeriesFormModal } from '../components/series/SeriesFormModal.js';
import { apiClient } from '../lib/api.js';
import { Series, Anime } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const AnimesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'series' | 'animes'>('series');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAniListModalOpen, setIsAniListModalOpen] = useState(false);
  const [isSeriesFormOpen, setIsSeriesFormOpen] = useState(false);
  const [selectedSeriesToEdit, setSelectedSeriesToEdit] = useState<Series | null>(null);
  const [selectedSeriesForSeasons, setSelectedSeriesForSeasons] = useState<Series | null>(null);
  const [selectedSeriesForCombine, setSelectedSeriesForCombine] = useState<Series | null>(null);

  // Individual Anime modal states
  const [isAnimeFormOpen, setIsAnimeFormOpen] = useState(false);
  const [selectedAnimeToEdit, setSelectedAnimeToEdit] = useState<Anime | null>(null);
  const [selectedAnimeToScrape, setSelectedAnimeToScrape] = useState<Anime | null>(null);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);

  // 1. Query Series
  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    refetch: refetchSeries,
  } = useQuery({
    queryKey: ['admin-series-list', statusFilter, searchQuery],
    queryFn: async () => {
      const { data } = await apiClient.get('/series', {
        params: {
          search: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 50,
        },
      });
      return (data.series || []) as any[];
    },
    enabled: activeTab === 'series',
  });

  // 2. Query individual Animes
  const {
    data: animesData,
    isLoading: isAnimesLoading,
    refetch: refetchAnimes,
  } = useQuery({
    queryKey: ['admin-animes-list', statusFilter],
    queryFn: async () => {
      const { data } = await apiClient.get('/animes', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 50,
        },
      });
      return (data.animes || data || []) as Anime[];
    },
    enabled: activeTab === 'animes',
  });

  const handleDeleteSeries = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta serie? (Debe tener 0 temporadas)')) return;
    try {
      await apiClient.delete(`/series/${id}`);
      refetchSeries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar serie';
      alert(msg);
    }
  };

  // Series Columns Definition
  const seriesColumns: Column<any>[] = [
    {
      header: 'Serie',
      cell: (item) => (
        <div className="flex items-center gap-3 min-w-[260px]">
          {item.cover_image ? (
            <img
              src={item.cover_image}
              alt={item.name}
              className="w-12 h-16 object-cover rounded-lg shrink-0 border border-slate-700/60"
            />
          ) : (
            <div className="w-12 h-16 bg-slate-800 rounded-lg shrink-0 flex items-center justify-center text-xs text-slate-500">
              Sin Cover
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
            <p className="text-xs text-slate-400 font-mono truncate">{item.slug}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="purple" size="sm">
                ID {item.id}
              </Badge>
              <Badge variant="primary" size="sm">
                {item.total_seasons_count || item.seasons?.length || 0} Temporadas
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (item) => (
        <Badge
          variant={
            item.status === 'emision'
              ? 'success'
              : item.status === 'finalizado'
              ? 'default'
              : 'warning'
          }
          size="sm"
        >
          {item.status}
        </Badge>
      ),
    },
    {
      header: 'Episodios',
      cell: (item) => (
        <span className="font-bold text-slate-200 font-mono text-sm">
          {item.total_episodes_count || 0} eps
        </span>
      ),
    },
    {
      header: 'Vistas',
      cell: (item) => (
        <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
          <Eye className="w-3.5 h-3.5" />
          {(item.views_count || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          {/* Manage Seasons & Entries */}
          <Button
            variant="primary"
            size="sm"
            icon={<Layers className="w-3.5 h-3.5" />}
            onClick={() => setSelectedSeriesForSeasons(item)}
            title="Gestionar Temporadas y Entregas (Crunchyroll Style)"
          >
            Temporadas
          </Button>

          {/* Merge / Combine Series (Admin only) */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              icon={<Merge className="w-3.5 h-3.5 text-amber-400" />}
              onClick={() => setSelectedSeriesForCombine(item)}
              title="Fusionar con otra serie"
            >
              Fusionar
            </Button>
          )}

          {/* Edit Series */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSeriesToEdit(item);
              setIsSeriesFormOpen(true);
            }}
            title="Editar Metadatos de la Serie"
          >
            <Edit2 className="w-4 h-4 text-slate-400 hover:text-white" />
          </Button>

          {/* Delete Series (Admin only) */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSeries(item.id)}
              title="Eliminar Serie (Debe estar vacía)"
            >
              <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-300" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Anime Entries Columns Definition
  const animeColumns: Column<Anime>[] = [
    {
      header: 'Entrega / Anime',
      cell: (anime) => (
        <div className="flex items-center gap-3 min-w-[240px]">
          {anime.cover_image && (
            <img
              src={anime.cover_image}
              alt={anime.name}
              className="w-10 h-14 object-cover rounded-lg shrink-0 border border-slate-700/60"
            />
          )}
          <div className="min-w-0">
            <h4 className="font-bold text-white text-sm truncate">{anime.name}</h4>
            <p className="text-xs text-slate-400 font-mono truncate">{anime.slug}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="purple" size="sm">
                ID {anime.id}
              </Badge>
              {anime.anilist_id && (
                <Badge size="sm">AniList #{anime.anilist_id}</Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (anime) => (
        <Badge
          variant={
            anime.status === 'emision'
              ? 'success'
              : anime.status === 'finalizado'
              ? 'default'
              : 'warning'
          }
          size="sm"
        >
          {anime.status}
        </Badge>
      ),
    },
    {
      header: 'Episodios',
      cell: (anime) => {
        const count = Array.isArray(anime.episodes)
          ? anime.episodes.length
          : typeof anime.episodes === 'number'
          ? anime.episodes
          : 0;
        return (
          <span className="font-bold text-slate-200 font-mono text-sm">
            {count} eps
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      className: 'text-right',
      cell: (anime) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/animes/${anime.id}/episodes`}>
            <Button
              variant="outline"
              size="sm"
              icon={<Tv className="w-3.5 h-3.5" />}
              title="Gestionar Episodios y Servidores"
            >
              Episodios
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            icon={<Cpu className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => {
              setSelectedAnimeToScrape(anime);
              setIsScrapeModalOpen(true);
            }}
            title="Scrapear Fuentes"
          >
            Scrapear
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAnimeToEdit(anime);
              setIsAnimeFormOpen(true);
            }}
            title="Editar Metadatos"
          >
            <Edit2 className="w-4 h-4 text-slate-400 hover:text-white" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Gestión de Series y Catálogo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra series públicas, selectores de temporada, entregas de AniList y servidores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedSeriesToEdit(null);
              setIsSeriesFormOpen(true);
            }}
          >
            Crear Serie
          </Button>
          <Button
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => setIsAniListModalOpen(true)}
          >
            Importar de AniList
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'series'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white glass-card'
          }`}
        >
          <Layers className="w-4 h-4" />
          Series y Temporadas (Público)
        </button>

        <button
          onClick={() => setActiveTab('animes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'animes'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white glass-card'
          }`}
        >
          <Film className="w-4 h-4" />
          Entregas Individuales / Scraping
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o slug..."
            className="glass-input w-full pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Estado:</span>
          <div className="min-w-[180px]">
            <DropdownSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'emision', label: 'En Emisión', badge: 'Activo' },
                { value: 'finalizado', label: 'Finalizado', badge: 'Completo' },
                { value: 'proximamente', label: 'Próximamente', badge: 'Próximo' },
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {activeTab === 'series' ? (
        <Table
          columns={seriesColumns}
          data={seriesData || []}
          isLoading={isSeriesLoading}
          emptyMessage="No hay series en el catálogo. Utiliza 'Importar de AniList' o 'Crear Serie' para comenzar."
        />
      ) : (
        <Table
          columns={animeColumns}
          data={animesData || []}
          isLoading={isAnimesLoading}
          emptyMessage="No hay entregas individuales registradas."
        />
      )}

      {/* Modal: Series Seasons & Entries Manager */}
      <SeriesSeasonsModal
        isOpen={!!selectedSeriesForSeasons}
        onClose={() => setSelectedSeriesForSeasons(null)}
        series={selectedSeriesForSeasons}
        onSuccess={() => {
          refetchSeries();
        }}
      />

      {/* Modal: Combine Series */}
      <CombineSeriesModal
        isOpen={!!selectedSeriesForCombine}
        onClose={() => setSelectedSeriesForCombine(null)}
        sourceSeries={selectedSeriesForCombine}
        onSuccess={() => {
          refetchSeries();
        }}
      />

      {/* Modal: Create / Edit Series */}
      <SeriesFormModal
        isOpen={isSeriesFormOpen}
        onClose={() => {
          setIsSeriesFormOpen(false);
          setSelectedSeriesToEdit(null);
        }}
        seriesToEdit={selectedSeriesToEdit}
        onSuccess={() => {
          refetchSeries();
        }}
      />

      {/* Modal: Create / Edit Anime Entry */}
      <AnimeFormModal
        isOpen={isAnimeFormOpen}
        onClose={() => {
          setIsAnimeFormOpen(false);
          setSelectedAnimeToEdit(null);
        }}
        animeToEdit={selectedAnimeToEdit}
        onSuccess={() => {
          refetchAnimes();
        }}
      />

      {/* Modal: AniList Importer */}
      <AniListImportModal
        isOpen={isAniListModalOpen}
        onClose={() => setIsAniListModalOpen(false)}
        onImportSuccess={() => {
          refetchSeries();
          refetchAnimes();
        }}
      />

      {/* Modal: Scrape Child Anime */}
      {selectedAnimeToScrape && (
        <ScrapeAnimeModal
          isOpen={isScrapeModalOpen}
          onClose={() => {
            setIsScrapeModalOpen(false);
            setSelectedAnimeToScrape(null);
          }}
          anime={selectedAnimeToScrape}
          onSuccess={() => refetchSeries()}
        />
      )}
    </div>
  );
};
