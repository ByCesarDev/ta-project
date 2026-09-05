import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Server,
  Cpu,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { AniListImportModal } from '../components/animes/AniListImportModal.js';
import { AnimeFormModal } from '../components/animes/AnimeFormModal.js';
import { Anime } from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const [isAniListModalOpen, setIsAniListModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch KPI Counts
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const [
        { count: animesCount },
        { count: episodesCount },
        { count: sourcesCount },
        { count: activeJobsCount },
      ] = await Promise.all([
        supabase.from('animes').select('*', { count: 'exact', head: true }),
        supabase.from('episodes').select('*', { count: 'exact', head: true }),
        supabase.from('episode_sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('scrape_jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
      ]);

      return {
        animes: animesCount || 0,
        episodes: episodesCount || 0,
        sources: sourcesCount || 0,
        activeJobs: activeJobsCount || 0,
      };
    },
  });

  // Fetch Latest Animes
  const { data: recentAnimes } = useQuery({
    queryKey: ['recent-animes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('animes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      return (data || []) as Anime[];
    },
  });

  // Fetch Provider Breakdown
  const { data: providerStats } = useQuery({
    queryKey: ['provider-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('episode_sources')
        .select('provider')
        .eq('is_active', true);

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.provider] = (counts[item.provider] || 0) + 1;
      });

      return Object.entries(counts).map(([provider, count]) => ({
        provider,
        count,
      }));
    },
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Centro de Mando • TotalAnime 2.0
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión del catálogo, servidores de video y monitoreo de tareas en segundo plano.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Anime
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Animes */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Film className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Animes
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-['Outfit']">
              {metrics?.animes ?? '—'}
            </span>
          </div>
        </Card>

        {/* KPI 2: Episodes */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Tv className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Episodios Catalogados
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-['Outfit']">
              {metrics?.episodes ?? '—'}
            </span>
          </div>
        </Card>

        {/* KPI 3: Video Sources */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Server className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Fuentes de Streaming
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-['Outfit']">
              {metrics?.sources ?? '—'}
            </span>
          </div>
        </Card>

        {/* KPI 4: Jobs */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Jobs en Ejecución
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight font-['Outfit']">
              {metrics?.activeJobs ?? '—'}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recently Added Series (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Series Recientemente Añadidas
            </h3>
            <Link
              to="/animes"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver Catálogo Completo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentAnimes?.map((anime) => (
              <div
                key={anime.id}
                className="glass-card rounded-2xl p-4 flex gap-4 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <img
                  src={anime.cover_image}
                  alt={anime.name}
                  className="w-16 h-24 object-cover rounded-xl shrink-0 border border-slate-700/60 shadow"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{anime.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {anime.title_romaji || anime.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
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
                      <span className="text-xs text-slate-400">{anime.episodes} eps</span>
                    </div>
                  </div>

                  <Link
                    to={`/animes/${anime.id}/episodes`}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2"
                  >
                    Gestionar Episodios <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Server Distribution Breakdown (1 col) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            Distribución de Servidores
          </h3>

          <Card className="space-y-4">
            <p className="text-xs text-slate-400">
              Conteo de enlaces activos distribuidos por proveedor de streaming:
            </p>

            <div className="space-y-3">
              {providerStats?.map((stat) => (
                <div key={stat.provider} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300 capitalize">{stat.provider}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (stat.count / (metrics?.sources || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-white font-mono min-w-8 text-right">
                      {stat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <Link to="/jobs">
                <Button variant="outline" size="sm" className="w-full">
                  Monitorear Cola de Scraping
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AniListImportModal
        isOpen={isAniListModalOpen}
        onClose={() => setIsAniListModalOpen(false)}
        onImportSuccess={() => {
          refetchMetrics();
        }}
      />

      <AnimeFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetchMetrics();
        }}
      />
    </div>
  );
};
