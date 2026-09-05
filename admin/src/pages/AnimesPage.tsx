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
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { apiClient } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Table, Column } from '../components/common/Table.js';
import { ClaimAnimeButton } from '../components/animes/ClaimAnimeButton.js';
import { AniListImportModal } from '../components/animes/AniListImportModal.js';
import { AnimeFormModal } from '../components/animes/AnimeFormModal.js';
import { Anime, AnimeStatus } from '../types/index.js';

export const AnimesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAniListModalOpen, setIsAniListModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAnimeToEdit, setSelectedAnimeToEdit] = useState<Anime | null>(null);
  const [triggeringJobId, setTriggeringJobId] = useState<number | null>(null);

  // Query Animes from Supabase
  const { data: animes, isLoading, refetch } = useQuery({
    queryKey: ['animes-catalog', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('animes')
        .select('*, anime_genres(genres(name))')
        .order('id', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as AnimeStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as (Anime & { anime_genres?: { genres: { name: string } }[] })[];
    },
  });

  // Filter animes by search query locally
  const filteredAnimes = animes?.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.title_romaji && a.title_romaji.toLowerCase().includes(q))
    );
  });

  const handleStartScrapeJob = async (anime: Anime) => {
    setTriggeringJobId(anime.id);
    try {
      await apiClient.post('/jobs/scrape', {
        animeId: anime.id,
        totalEpisodes: anime.episodes,
      });
      alert(`Job de scraping encolado con éxito para ${anime.name}.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al encolar job';
      alert(`Error: ${message}`);
    } finally {
      setTriggeringJobId(null);
    }
  };

  const columns: Column<Anime>[] = [
    {
      header: 'Anime',
      cell: (anime) => (
        <div className="flex items-center gap-3 min-w-[240px]">
          <img
            src={anime.cover_image}
            alt={anime.name}
            className="w-12 h-16 object-cover rounded-lg shrink-0 border border-slate-700/60"
          />
          <div className="min-w-0">
            <h4 className="font-bold text-white text-sm truncate">{anime.name}</h4>
            <p className="text-xs text-slate-400 font-mono truncate">{anime.slug}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="purple" size="sm">
                ID {anime.id}
              </Badge>
              {anime.format && <Badge size="sm">{anime.format}</Badge>}
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
      cell: (anime) => (
        <span className="font-bold text-slate-200 font-mono text-sm">
          {anime.episodes} eps
        </span>
      ),
    },
    {
      header: 'Vistas',
      cell: (anime) => (
        <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
          <Eye className="w-3.5 h-3.5" />
          {anime.views_count.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Moderación',
      cell: (anime) => (
        <ClaimAnimeButton
          animeId={anime.id}
          claimedBy={anime.claimed_by}
          onSuccess={() => refetch()}
        />
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      cell: (anime) => (
        <div className="flex items-center justify-end gap-2">
          {/* Manage Episodes */}
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

          {/* Trigger Scrape Job */}
          <Button
            variant="secondary"
            size="sm"
            isLoading={triggeringJobId === anime.id}
            icon={<Cpu className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => handleStartScrapeJob(anime)}
            title="Iniciar job de scraping automático de servidores"
          >
            Scrape
          </Button>

          {/* Edit Anime */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAnimeToEdit(anime);
              setIsFormModalOpen(true);
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
            Catálogo Oficial de Series
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra los títulos, metadatos, moderadores asignados y servidores de streaming.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedAnimeToEdit(null);
              setIsFormModalOpen(true);
            }}
          >
            Crear Anime
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-2 bg-[#0b0f19]"
          >
            <option value="all">Todos los estados</option>
            <option value="emision">En Emisión (emision)</option>
            <option value="finalizado">Finalizado (finalizado)</option>
            <option value="proximamente">Próximamente (proximamente)</option>
          </select>
        </div>
      </div>

      {/* Animes Table */}
      <Table
        columns={columns}
        data={filteredAnimes || []}
        isLoading={isLoading}
        emptyMessage="No se encontraron animes que coincidan con la búsqueda."
      />

      {/* AniList Import Modal */}
      <AniListImportModal
        isOpen={isAniListModalOpen}
        onClose={() => setIsAniListModalOpen(false)}
        onImportSuccess={() => refetch()}
      />

      {/* Create / Edit Modal */}
      <AnimeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        animeToEdit={selectedAnimeToEdit}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
