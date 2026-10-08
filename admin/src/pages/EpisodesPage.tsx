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
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { supabase } from '../lib/supabase.js';
import { apiClient } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Table, Column } from '../components/common/Table.js';
import { EpisodeSourcesModal } from '../components/episodes/EpisodeSourcesModal.js';
import { ScrapeAnimeModal } from '../components/animes/ScrapeAnimeModal.js';
import { Episode, Anime } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const EpisodesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || '0', 10);
  const { isAdmin } = useAuth();

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [targetEpisodeNumberToScrape, setTargetEpisodeNumberToScrape] = useState<number | undefined>(undefined);
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);
  const [generatingEpId, setGeneratingEpId] = useState<number | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleGenerateSingleThumbnail = async (episodeId: number, epNum: number) => {
    setGeneratingEpId(episodeId);
    try {
      await apiClient.post<{ success: boolean; thumbnail_url: string; message: string }>(
        `/thumbnails/episodes/${episodeId}/generate`
      );
      showNotification('success', `Portada del Episodio #${epNum} generada exitosamente.`);
      refetch();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || err.message || 'Error al generar la portada.');
    } finally {
      setGeneratingEpId(null);
    }
  };

  const handleBulkGenerateThumbnails = async () => {
    if (!animeId) return;
    setIsBulkGenerating(true);
    try {
      const res = await apiClient.post<{ success: boolean; summary: { successCount: number; total: number }; message: string }>(
        `/thumbnails/animes/${animeId}/generate-all`
      );
      showNotification('success', res.data.message || 'Portadas generadas para todos los episodios.');
      refetch();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || err.message || 'Error al generar portadas en lote.');
    } finally {
      setIsBulkGenerating(false);
    }
  };

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
      showNotification('error', `Error: ${message}`);
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
      showNotification('error', `Error: ${message}`);
    }
  };

  const columns: Column<Episode & { episode_sources?: { id: number; provider: string; is_active: boolean }[] }>[] = [
    {
      header: 'Episodio y Portada',
      cell: (ep) => (
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-10 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center">
            {ep.thumbnail ? (
              <img
                src={ep.thumbnail}
                alt={`Ep ${ep.episode_number}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[8px] font-mono">Sin Frame</span>
              </div>
            )}
            <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] font-mono text-white px-1 rounded">
              #{ep.episode_number}
            </div>
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
          {/* Generate Frame Thumbnail Button */}
          <Button
            variant="outline"
            size="sm"
            icon={<Camera className="w-3.5 h-3.5 text-indigo-400" />}
            isLoading={generatingEpId === ep.id}
            onClick={() => handleGenerateSingleThumbnail(ep.id, ep.episode_number)}
            title="Capturar fotograma aleatorio con FFmpeg"
          >
            {ep.thumbnail ? 'Re-capturar' : 'Generar Frame'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            onClick={() => {
              setTargetEpisodeNumberToScrape(ep.episode_number);
              setIsScrapeModalOpen(true);
            }}
            title="Scrapear este episodio con Seekee/Cluster"
          >
            Scrapear
          </Button>

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
    <div className="space-y-6 animate-in fade-in duration-200">
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

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              icon={<Camera className="w-4 h-4 text-indigo-400" />}
              isLoading={isBulkGenerating}
              onClick={handleBulkGenerateThumbnails}
              title="Generar portadas (frames aleatorios) para todos los episodios"
            >
              Generar Todos los Frames
            </Button>

            <Button
              variant="secondary"
              icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
              onClick={() => {
                setTargetEpisodeNumberToScrape(undefined);
                setIsScrapeModalOpen(true);
              }}
            >
              Scrapear Anime
            </Button>

            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              isLoading={isCreatingEpisode}
              onClick={handleCreateNextEpisode}
            >
              Añadir Episodio
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

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

      {/* Scrape Anime / Episode Modal */}
      <ScrapeAnimeModal
        isOpen={isScrapeModalOpen}
        onClose={() => setIsScrapeModalOpen(false)}
        anime={anime || null}
        targetEpisodeNumber={targetEpisodeNumberToScrape}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
