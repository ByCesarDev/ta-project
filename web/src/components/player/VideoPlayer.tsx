import React, { useEffect, useRef } from 'react';
import { EpisodeSourceRow } from '../../types/index.js';
import { useSaveProgress } from '../../hooks/useWatchHistory.js';
import { AlertCircle, Film } from 'lucide-react';

interface VideoPlayerProps {
  episodeId: number;
  selectedSource: EpisodeSourceRow | null;
  durationMinutes?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episodeId,
  selectedSource,
  durationMinutes = 24,
}) => {
  const saveProgressMutation = useSaveProgress();
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchedSecondsRef = useRef(0);

  // Auto-record progress in public.user_history while active
  useEffect(() => {
    watchedSecondsRef.current = 0;
    const totalDurationSeconds = durationMinutes * 60;

    // Periodically save every 15 seconds
    progressTimerRef.current = setInterval(() => {
      watchedSecondsRef.current += 15;
      saveProgressMutation.mutate({
        episodeId,
        progressSeconds: watchedSecondsRef.current,
        totalSeconds: totalDurationSeconds,
      });
    }, 15000);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      // Save final progress on unmount if user watched > 10 seconds
      if (watchedSecondsRef.current >= 10) {
        saveProgressMutation.mutate({
          episodeId,
          progressSeconds: watchedSecondsRef.current,
          totalSeconds: totalDurationSeconds,
        });
      }
    };
  }, [episodeId, durationMinutes]);

  if (!selectedSource || !selectedSource.embed_url) {
    return (
      <div className="w-full aspect-video-player rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center mb-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-white text-lg font-['Outfit'] mb-1">
          No hay servidores de video disponibles
        </h3>
        <p className="text-slate-400 text-xs max-w-md">
          Este episodio aún no cuenta con servidores activos o se encuentra en proceso de sincronización.
          Por favor, intenta nuevamente más tarde o prueba con otro servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video-player rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl shadow-indigo-950/20 mb-6 group">
      <iframe
        src={selectedSource.embed_url}
        title={`Reproductor ${selectedSource.server_name}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        className="w-full h-full border-0 absolute inset-0"
      />

      {/* Floating server indicator overlay */}
      <div className="absolute top-3 right-3 z-10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono text-slate-300 border border-white/10 shadow-lg">
          <Film className="w-3.5 h-3.5 text-indigo-400" />
          {selectedSource.server_name || selectedSource.provider}
        </span>
      </div>
    </div>
  );
};
