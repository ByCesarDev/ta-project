import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Server,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { supabase } from '../lib/supabase.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Table, Column } from '../components/common/Table.js';
import { EpisodeSourcesModal } from '../components/episodes/EpisodeSourcesModal.js';
import { Episode, Anime } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const EpisodesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || '0', 10);
  const { isAdmin } = useAuth();

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);

  // Fetch Anime details
  const { data: anime } = useQuery({
    queryKey: ['anime-detail', animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animes')
        .select('*')
        .eq('id', animeId)
        .single();
      if (error) throw error;
      return data as Anime;
    },
    enabled: animeId > 0,
  });

  // Fetch Episodes with active sources count
  const { data: episodes, isLoading, refetch } = useQuery({
    queryKey: ['anime-episodes', animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*, episode_sources(id, provider, is_active)')
        .eq('anime_id', animeId)
        .order('episode_number', { ascending: true });

      if (error) throw error;
      return (data || []) as (Episode & { episode_sources?: { id: number; provider: string; is_active: boolean }[] })[];
    },
    enabled: animeId > 0,
  });

  const handleCreateNextEpisode = async () => {
    if (!anime) return;
    setIsCreatingEpisode(true);
    try {
      const maxEpNum = episodes && episodes.length > 0
        ? Math.max(...episodes.map((e) => e.episode_number))
        : 0;
      const nextEpNum = maxEpNum + 1;

      const { error } = await supabase.from('episodes').insert({
        anime_id: animeId,
        episode_number: nextEpNum,
        title: `Episodio ${nextEpNum}`,
        status: 'pending',
        views: 0,
      });

      if (error) throw error;
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear episodio';
      alert(`Error: ${message}`);
    } finally {
      setIsCreatingEpisode(false);
    }
  };

  const handleDeleteEpisode = async (episodeId: number, epNum: number) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar episodios.');
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar el Episodio ${epNum}?`)) return;

    try {
      const { error } = await supabase.from('episodes').delete().eq('id', episodeId);
      if (error) throw error;
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar episodio';
      alert(`Error: ${message}`);
    }
  };

  const columns: Column<Episode & { episode_sources?: { id: number; provider: string; is_active: boolean }[] }>[] = [
    {
      header: 'Episodio',
      cell: (ep) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 font-mono text-sm">
            #{ep.episode_number}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              {ep.title || `Episodio ${ep.episode_number}`}
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">ID: {ep.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (ep) => (
        <Badge
          variant={
            ep.status === 'available'
              ? 'success'
              : ep.status === 'pending'
              ? 'warning'
              : 'danger'
          }
          size="sm"
        >
          {ep.status === 'available' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {ep.status}
        </Badge>
      ),
    },
    {
      header: 'Servidores Activos',
      cell: (ep) => {
        const activeCount = ep.episode_sources?.filter((s) => s.is_active).length || 0;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                activeCount > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {activeCount} servidor(es)
            </span>
          </div>
        );
      },
    },
    {
      header: 'Reproducciones',
      cell: (ep) => (
        <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
          <Eye className="w-3.5 h-3.5" />
          {ep.views.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      cell: (ep) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Server className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedEpisode(ep);
              setIsSourcesModalOpen(true);
            }}
          >
            Servidores
          </Button>

          {isAdmin && (
            <button
              onClick={() => handleDeleteEpisode(ep.id, ep.episode_number)}
              className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Eliminar Episodio (Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button and Header */}
      <div>
        <Link
          to="/animes"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 font-semibold mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Catálogo de Animes
        </Link>

        <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800/80">
          <div className="flex items-center gap-4">
            {anime?.cover_image && (
              <img
                src={anime.cover_image}
                alt={anime.name}
                className="w-16 h-24 object-cover rounded-xl border border-slate-700/60 shadow"
              />
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Outfit']">
                {anime?.name || 'Cargando serie...'}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Slug: {anime?.slug} • {episodes?.length || 0} episodios registrados
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="primary" size="sm">
                  {anime?.status}
                </Badge>
                <Badge size="sm">{anime?.format}</Badge>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            isLoading={isCreatingEpisode}
            onClick={handleCreateNextEpisode}
          >
            Añadir Siguiente Episodio
          </Button>
        </div>
      </div>

      {/* Episodes Table */}
      <Table
        columns={columns}
        data={episodes || []}
        isLoading={isLoading}
        emptyMessage="No hay episodios registrados para este anime aún."
      />

      {/* Episode Sources Modal */}
      <EpisodeSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        episode={selectedEpisode}
        animeName={anime?.name || ''}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
