import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Settings,
  Film,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { EpisodeSourceRow, PlayableStream } from '../../types/index.js';
import { useSaveProgress, useEpisodeProgress } from '../../hooks/useWatchHistory.js';
import { resolveStreamSource } from '../../lib/streamResolver.js';
import { formatTime } from '../../lib/utils.js';

interface TotalAnimePlayerProps {
  episodeId: number;
  animeTitle?: string;
  episodeNumber?: number;
  selectedSource: EpisodeSourceRow | null;
  onSelectNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const TotalAnimePlayer: React.FC<TotalAnimePlayerProps> = ({
  episodeId,
  animeTitle,
  episodeNumber,
  selectedSource,
  onSelectNextEpisode,
  hasNextEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecordedTimeRef = useRef<number>(0);
  const initialSeekDoneRef = useRef<boolean>(false);

  // Playback state
  const [stream, setStream] = useState<PlayableStream | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('ta_player_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('ta_player_muted') === 'true';
  });
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    const saved = localStorage.getItem('ta_player_rate');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPiP, setIsPiP] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [resumeToast, setResumeToast] = useState<string | null>(null);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'rewind' | 'forward' | null>(null);

  // Progress Queries and Mutations
  const { data: savedProgress } = useEpisodeProgress(episodeId);
  const saveProgressMutation = useSaveProgress();

  // Helper to persist current exact playback time
  const triggerSaveProgress = useCallback(
    (timeToSave: number, totalDuration: number) => {
      if (timeToSave < 2 || totalDuration <= 0) return;
      lastRecordedTimeRef.current = timeToSave;
      saveProgressMutation.mutate({
        episodeId,
        progressSeconds: timeToSave,
        totalSeconds: totalDuration,
      });
    },
    [episodeId, saveProgressMutation]
  );

  // Reset initial seek state when episode changes
  useEffect(() => {
    initialSeekDoneRef.current = false;
    lastRecordedTimeRef.current = 0;
  }, [episodeId]);

  // 1. Resolve Stream Source when selectedSource changes
  useEffect(() => {
    if (!selectedSource) {
      setStream(null);
      return;
    }

    let isCancelled = false;
    setIsResolving(true);

    resolveStreamSource(selectedSource)
      .then((resolved) => {
        if (!isCancelled) {
          setStream(resolved);
          setIsResolving(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          // Fallback to iframe
          setStream({
            source_id: selectedSource.id,
            provider: selectedSource.provider,
            server_name: selectedSource.server_name || selectedSource.provider,
            type: 'iframe',
            url: selectedSource.embed_url,
            is_fallback: true,
          });
          setIsResolving(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSource]);

  // 2. Attach HLS.js or Native Video when stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || stream.type === 'iframe') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = stream.url;

    if (stream.type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: -1,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        autoStartLoad: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setIsBuffering(false);
        });
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        setIsBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              // Fallback to iframe
              setStream((prev) => (prev ? { ...prev, type: 'iframe', is_fallback: true } : null));
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || stream.type === 'mp4') {
      // Native HLS (Safari/iOS) or direct MP4
      video.src = streamUrl;
      video.load();
      setIsBuffering(false);
      video.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream, selectedSource]);

  // 3. Auto-Resume logic once video metadata is ready
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);

    // If we have saved progress and have not performed initial seek
    if (!initialSeekDoneRef.current && savedProgress?.progress_seconds) {
      const targetTime = savedProgress.progress_seconds;
      const totalDur = savedProgress.total_seconds || video.duration;

      // Only resume if target time is valid and episode is not completed (>95%)
      if (targetTime > 5 && (!totalDur || targetTime < totalDur * 0.95)) {
        video.currentTime = targetTime;
        setCurrentTime(targetTime);
        setResumeToast(`Reanudando en ${formatTime(targetTime)}`);
        setTimeout(() => setResumeToast(null), 3500);
      }
      initialSeekDoneRef.current = true;
    } else if (lastRecordedTimeRef.current > 5) {
      // Preserve timestamp on server switch
      video.currentTime = lastRecordedTimeRef.current;
      setCurrentTime(lastRecordedTimeRef.current);
    }
  };

  // 4. Video Event Handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const cur = video.currentTime;
    setCurrentTime(cur);

    // Calculate buffer percentage
    if (video.buffered.length > 0) {
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
          setBufferedEnd(video.buffered.end(i));
          break;
        }
      }
    }

    // Auto-save progress every 8 seconds while playing
    if (Math.abs(cur - lastRecordedTimeRef.current) >= 8) {
      triggerSaveProgress(cur, video.duration);
    }
  };

  // Immediate Save on Key Lifecycle Events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && videoRef.current) {
        triggerSaveProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    };

    const handleBeforeUnload = () => {
      if (videoRef.current) {
        triggerSaveProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (videoRef.current) {
        triggerSaveProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    };
  }, [triggerSaveProgress]);

  // Sync volume and playback rate to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hide timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 2800);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      triggerSaveProgress(video.currentTime, video.duration);
    }
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    triggerSaveProgress(newTime, video.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;

    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    triggerSaveProgress(targetTime, duration);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('ta_player_muted', String(next));
      return next;
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    localStorage.setItem('ta_player_volume', String(newVol));
    localStorage.setItem('ta_player_muted', String(newVol === 0));
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {
      // PiP not supported or rejected
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          resetControlsTimer();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          seekRelative(-10);
          resetControlsTimer();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          seekRelative(10);
          resetControlsTimer();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            localStorage.setItem('ta_player_volume', String(next));
            return next;
          });
          setIsMuted(false);
          resetControlsTimer();
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            localStorage.setItem('ta_player_volume', String(next));
            return next;
          });
          resetControlsTimer();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, resetControlsTimer]);

  // Touch Double Tap for mobile ±10s
  const lastTouchTimeRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    const rect = containerRef.current?.getBoundingClientRect();

    if (now - lastTouchTimeRef.current.time < 300 && rect) {
      const touchX = touch.clientX - rect.left;
      const isLeft = touchX < rect.width * 0.4;
      const isRight = touchX > rect.width * 0.6;

      if (isLeft) {
        seekRelative(-10);
        setDoubleTapFeedback('rewind');
        setTimeout(() => setDoubleTapFeedback(null), 600);
      } else if (isRight) {
        seekRelative(10);
        setDoubleTapFeedback('forward');
        setTimeout(() => setDoubleTapFeedback(null), 600);
      }
    }
    lastTouchTimeRef.current = { time: now, x: touch.clientX };
  };

  // No active sources available
  if (!selectedSource || (!selectedSource.embed_url && !selectedSource.direct_stream_url)) {
    return (
      <div className="w-full aspect-video-player rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center p-6 text-center mb-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
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

  // Fallback: Embed Iframe Mode
  if (stream?.type === 'iframe') {
    return (
      <div className="relative w-full aspect-video-player rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl shadow-indigo-950/20 mb-6 group">
        <iframe
          src={stream.url}
          title={`Reproductor ${stream.server_name}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          className="w-full h-full border-0 absolute inset-0"
        />

        {/* Top Info Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono text-slate-300 border border-white/10 shadow-lg">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              {stream.server_name} <span className="text-[9px] text-amber-300/80">(Modo Embed)</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full aspect-video-player rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl shadow-indigo-950/30 mb-6 select-none group ${
        isFullscreen ? 'rounded-none border-0' : ''
      }`}
    >
      {/* HTML5 Native / HLS Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          if (videoRef.current) {
            triggerSaveProgress(videoRef.current.currentTime, videoRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (videoRef.current) {
            triggerSaveProgress(videoRef.current.duration, videoRef.current.duration);
          }
          if (hasNextEpisode && onSelectNextEpisode) {
            onSelectNextEpisode();
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onLoadedData={() => setIsBuffering(false)}
        onError={() => {
          setIsBuffering(false);
          if (selectedSource?.embed_url) {
            console.warn('[TotalAnimePlayer] Native video error. Falling back to embed iframe.');
            setStream({
              source_id: selectedSource.id,
              provider: selectedSource.provider,
              server_name: selectedSource.server_name || selectedSource.provider,
              type: 'iframe',
              url: selectedSource.embed_url,
              is_fallback: true,
            });
          }
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Loading Overlay */}
      {((isResolving && !stream) || (isBuffering && isPlaying)) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-2" />
          <p className="text-xs text-slate-300 font-mono tracking-wider">
            {isResolving ? 'Iniciando reproductor...' : 'Cargando buffer...'}
          </p>
        </div>
      )}

      {/* Center Play Button Overlay when paused */}
      {!isPlaying && !isResolving && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center group/center cursor-pointer bg-black/20 hover:bg-black/10 transition-colors"
          title="Reproducir (Espacio/K)"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 transform group-hover/center:scale-110 transition-all border border-indigo-400/40">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
          </div>
        </button>
      )}

      {/* Resume Toast Notification */}
      {resumeToast && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 text-xs font-semibold backdrop-blur-md shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>{resumeToast}</span>
        </div>
      )}

      {/* Double Tap Ripple Animations for Mobile */}
      {doubleTapFeedback && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center w-24 h-24 rounded-full bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 text-white font-bold text-sm animate-ping ${
            doubleTapFeedback === 'rewind' ? 'left-10' : 'right-10'
          }`}
        >
          {doubleTapFeedback === 'rewind' ? '« -10s' : '+10s »'}
        </div>
      )}

      {/* Top Header Controls (Fade with controls) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          {animeTitle && (
            <span className="text-xs font-bold text-white font-['Outfit'] drop-shadow-md">
              {animeTitle} {episodeNumber ? `• Episodio ${episodeNumber}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-mono text-emerald-400 border border-emerald-500/20 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {stream?.server_name || selectedSource.server_name || selectedSource.provider}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Real Scrubbable Seek Bar */}
        <div
          onClick={handleSeek}
          className="relative w-full h-2 group/bar hover:h-3.5 bg-white/20 rounded-full cursor-pointer transition-all flex items-center"
        >
          {/* Buffered Range */}
          <div
            style={{ width: `${bufferedPercent}%` }}
            className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all"
          />

          {/* Current Progress */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full relative"
          >
            {/* Seek Thumb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform" />
          </div>
        </div>

        {/* Buttons and Time Bar */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Actions */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              title={isPlaying ? 'Pausa (Espacio/K)' : 'Reproducir (Espacio/K)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
              title="Retroceder 10s (←/J)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => seekRelative(10)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
              title="Adelantar 10s (→/L)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
                title="Silenciar (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1.5 bg-white/20 accent-indigo-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Timestamps */}
            <div className="text-[11px] font-mono text-slate-300 ml-1">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 relative">
            {/* Speed / Settings Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className={`p-2 hover:bg-white/10 rounded-xl transition-colors ${
                  showSettings ? 'text-indigo-400 bg-white/10' : 'text-slate-300 hover:text-white'
                }`}
                title="Ajustes de Reproducción"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Settings Dropdown Popover */}
              {showSettings && (
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl z-40 animate-fade-in">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                    Velocidad
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {SPEED_OPTIONS.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          localStorage.setItem('ta_player_rate', String(rate));
                          setShowSettings(false);
                        }}
                        className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                          playbackRate === rate
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        {playbackRate === rate && <Check className="w-3 h-3" />}
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            {document.pictureInPictureEnabled && (
              <button
                onClick={togglePiP}
                className={`p-2 hover:bg-white/10 rounded-xl transition-colors ${
                  isPiP ? 'text-indigo-400 bg-white/10' : 'text-slate-300 hover:text-white'
                }`}
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
              title="Pantalla Completa (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
