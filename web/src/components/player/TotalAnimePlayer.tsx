import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Headphones,
  Sliders,
  Gauge,
  MessageSquare,
  Palette,
} from 'lucide-react';
import { EpisodeSourceRow, PlayableStream, StreamLanguage } from '../../types/index.js';
import { useSaveProgress, useEpisodeProgress } from '../../hooks/useWatchHistory.js';
import { resolveStreamSource } from '../../lib/streamResolver.js';
import { formatTime } from '../../lib/utils.js';

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url?: string;
  isDefault?: boolean;
}

export interface SubtitleStyleConfig {
  fontSize: 'small' | 'medium' | 'large';
  color: string;
  background: 'shadow' | 'box';
}

interface TotalAnimePlayerProps {
  episodeId: number;
  animeTitle?: string;
  episodeNumber?: number;
  selectedSource: EpisodeSourceRow | null;
  availableSources?: EpisodeSourceRow[];
  availableLanguages?: StreamLanguage[];
  selectedLanguage?: StreamLanguage;
  onSelectLanguage?: (lang: StreamLanguage) => void;
  selectedQuality?: string;
  onSelectQuality?: (quality: string) => void;
  subtitles?: SubtitleTrack[];
  onSelectNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const STANDARD_FALLBACK_QUALITIES = ['Auto', '1080p', '720p', '540p', '360p'];

export const TotalAnimePlayer: React.FC<TotalAnimePlayerProps> = ({
  episodeId,
  animeTitle,
  episodeNumber,
  selectedSource,
  availableSources = [],
  availableLanguages = ['sub', 'dub'],
  selectedLanguage = 'sub',
  onSelectLanguage,
  selectedQuality = 'Auto',
  onSelectQuality,
  subtitles = [],
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

  // Settings Menu Popover state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<
    'main' | 'audio' | 'quality' | 'speed' | 'subtitles' | 'subtitle-style'
  >('main');

  // Quality state
  const [hlsQualityLevels, setHlsQualityLevels] = useState<Array<{ label: string; level: number }>>([]);
  const [activeQuality, setActiveQuality] = useState<string>(selectedQuality || 'Auto');

  // Subtitles state
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(() => {
    const saved = localStorage.getItem('ta_player_subtitle_lang');
    return saved !== null ? (saved === 'off' ? null : saved) : 'es';
  });

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyleConfig>(() => {
    const saved = localStorage.getItem('ta_player_subtitle_style');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return {
      fontSize: 'medium',
      color: '#ffffff',
      background: 'shadow',
    };
  });

  const [activeCueText, setActiveCueText] = useState<string | null>(null);
  const [parsedCues, setParsedCues] = useState<Array<{ start: number; end: number; text: string }>>([]);
  const parsedCuesRef = useRef<Array<{ start: number; end: number; text: string }>>([]);
  parsedCuesRef.current = parsedCues;
  const [hlsSubtitleTracks, setHlsSubtitleTracks] = useState<
    Array<{ index: number; label: string; lang: string }>
  >([]);

  // Combined available subtitle tracks (props + stream metadata + HLS embedded)
  const allSubtitleTracks = useMemo<SubtitleTrack[]>(() => {
    const list: SubtitleTrack[] = [];
    const seenIds = new Set<string>();

    // 1. External tracks from props & stream
    const external = [...(subtitles || []), ...(stream?.subtitles || [])];
    for (const track of external) {
      if (track && track.id && !seenIds.has(track.id)) {
        seenIds.add(track.id);
        list.push(track);
      }
    }

    // 2. Embedded tracks from HLS
    for (const hlsTrack of hlsSubtitleTracks) {
      const trackId = `hls_${hlsTrack.index}`;
      if (!seenIds.has(trackId)) {
        seenIds.add(trackId);
        list.push({
          id: trackId,
          language: hlsTrack.lang || 'und',
          label: hlsTrack.label || `Pista ${hlsTrack.index + 1}`,
        });
      }
    }

    return list;
  }, [subtitles, stream?.subtitles, hlsSubtitleTracks]);

  // Human-readable active subtitle label for menu
  const selectedSubtitleLabel = useMemo(() => {
    if (selectedSubtitle === null) return 'Desactivados';
    const match = allSubtitleTracks.find(
      (s) =>
        s.id === selectedSubtitle ||
        s.language === selectedSubtitle ||
        (selectedSubtitle === 'es' && (s.language === 'es' || s.label.toLowerCase().includes('español') || s.label.toLowerCase().includes('spanish'))) ||
        (selectedSubtitle === 'en' && (s.language === 'en' || s.label.toLowerCase().includes('english') || s.label.toLowerCase().includes('inglés')))
    );
    if (match) return match.label;
    if (selectedSubtitle === 'es') return 'Español';
    if (selectedSubtitle === 'en') return 'English';
    return selectedSubtitle;
  }, [selectedSubtitle, allSubtitleTracks]);

  // HLS audio tracks state
  const [hlsAudioTracks, setHlsAudioTracks] = useState<Array<{ id: number; label: string; lang: string }>>([]);
  const [activeHlsAudioTrack, setActiveHlsAudioTrack] = useState<number>(-1);

  const [resumeToast, setResumeToast] = useState<string | null>(null);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'rewind' | 'forward' | null>(null);

  // Progress Queries and Mutations
  const { data: savedProgress } = useEpisodeProgress(episodeId);
  const saveProgressMutation = useSaveProgress();
  const saveMutationRef = useRef(saveProgressMutation);
  saveMutationRef.current = saveProgressMutation;

  // Helper to persist current exact playback time
  const triggerSaveProgress = useCallback(
    (timeToSave: number, totalDuration: number) => {
      if (timeToSave < 2 || totalDuration <= 0) return;
      lastRecordedTimeRef.current = timeToSave;
      saveMutationRef.current.mutate({
        episodeId,
        progressSeconds: timeToSave,
        totalSeconds: totalDuration,
      });
    },
    [episodeId]
  );

  // Reset initial seek state when episode changes
  useEffect(() => {
    initialSeekDoneRef.current = false;
    lastRecordedTimeRef.current = 0;
  }, [episodeId]);

  // Keep activeQuality in sync with selectedQuality prop
  useEffect(() => {
    if (selectedQuality) {
      setActiveQuality(selectedQuality);
    }
  }, [selectedQuality]);

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
          setStream({
            source_id: selectedSource.id,
            provider: selectedSource.provider,
            server_name: selectedSource.server_name || selectedSource.provider,
            type: 'error',
            url: '',
            error_message: `No se pudo conectar con el servidor ${selectedSource.server_name || selectedSource.provider}.`,
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

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsBuffering(false);
        if (data?.levels && data.levels.length > 0) {
          const parsed = data.levels.map((lvl, idx) => ({
            label: lvl.height ? `${lvl.height}p` : `Nivel ${idx + 1}`,
            level: idx,
          }));
          setHlsQualityLevels(parsed);
        }

        // Check for embedded audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const audioList = hls.audioTracks.map((t, idx) => ({
            id: idx,
            label: t.name || t.lang || `Pista ${idx + 1}`,
            lang: t.lang || 'und',
          }));
          setHlsAudioTracks(audioList);
          setActiveHlsAudioTrack(hls.audioTrack);
        }

        // Check for embedded subtitle tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          const subList = hls.subtitleTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `Subtítulo ${idx + 1}`,
            lang: t.lang || 'und',
          }));
          setHlsSubtitleTracks(subList);
        }

        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setIsBuffering(false);
        });
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const audioList = data.audioTracks.map((t, idx) => ({
            id: idx,
            label: t.name || t.lang || `Pista ${idx + 1}`,
            lang: t.lang || 'und',
          }));
          setHlsAudioTracks(audioList);
        }
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event, data) => {
        if (data.subtitleTracks && data.subtitleTracks.length > 0) {
          const subList = data.subtitleTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `Subtítulo ${idx + 1}`,
            lang: t.lang || 'und',
          }));
          setHlsSubtitleTracks(subList);
        }
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
  }, [stream]);

  // 3. Subtitles Loader & WebVTT/SRT Parser
  useEffect(() => {
    if (!selectedSubtitle) {
      setParsedCues([]);
      setActiveCueText(null);
      if (hlsRef.current) {
        hlsRef.current.subtitleTrack = -1;
      }
      return;
    }

    // 1. Check if selectedSubtitle matches an HLS track
    const matchedHls = hlsSubtitleTracks.find(
      (h) => `hls_${h.index}` === selectedSubtitle || h.lang === selectedSubtitle
    );

    if (matchedHls && hlsRef.current) {
      hlsRef.current.subtitleTrack = matchedHls.index;
      setParsedCues([]);
      return;
    }

    // 2. Check if selectedSubtitle matches an external track (SRT/VTT)
    const matchedTrack = allSubtitleTracks.find(
      (s) =>
        s.id === selectedSubtitle ||
        s.language === selectedSubtitle ||
        (selectedSubtitle === 'es' && (s.language === 'es' || s.label.toLowerCase().includes('español') || s.label.toLowerCase().includes('spanish'))) ||
        (selectedSubtitle === 'en' && (s.language === 'en' || s.label.toLowerCase().includes('english') || s.label.toLowerCase().includes('inglés')))
    );

    if (matchedTrack?.url) {
      if (hlsRef.current) {
        hlsRef.current.subtitleTrack = -1;
      }

      fetch(matchedTrack.url, { referrerPolicy: 'no-referrer' })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((rawText) => {
          const cues: Array<{ start: number; end: number; text: string }> = [];
          const lines = rawText.split(/\r?\n/);
          let i = 0;

          const parseTime = (timeStr: string): number => {
            if (!timeStr) return 0;
            const clean = timeStr.trim().replace(/[^\d:.,]/g, '');
            const parts = clean.split(':');
            if (parts.length === 3) {
              const [h, m, s] = parts;
              return (parseFloat(h) || 0) * 3600 + (parseFloat(m) || 0) * 60 + (parseFloat(s.replace(',', '.')) || 0);
            } else if (parts.length === 2) {
              const [m, s] = parts;
              return (parseFloat(m) || 0) * 60 + (parseFloat(s.replace(',', '.')) || 0);
            } else if (parts.length === 1) {
              return parseFloat(parts[0].replace(',', '.')) || 0;
            }
            return 0;
          };

          while (i < lines.length) {
            const line = lines[i].trim();
            if (line.includes('-->')) {
              const [startStr, endRaw] = line.split('-->');
              const start = parseTime(startStr);
              const endStr = endRaw.trim().split(/\s+/)[0];
              const end = parseTime(endStr);
              i++;
              const textLines: string[] = [];
              while (i < lines.length && lines[i].trim() !== '') {
                const cleanLine = lines[i].trim().replace(/<\/?[^>]+(>|$)/g, '').replace(/\{[^}]+\}/g, '');
                if (cleanLine.length > 0) {
                  textLines.push(cleanLine);
                }
                i++;
              }
              if (textLines.length > 0 && end > start) {
                cues.push({ start, end, text: textLines.join('<br />') });
              }
            }
            i++;
          }
          parsedCuesRef.current = cues;
          setParsedCues(cues);

          // Immediate sync with current video timestamp
          if (videoRef.current) {
            const cur = videoRef.current.currentTime;
            const matchingCue = cues.find((c) => c.start <= cur && cur <= c.end);
            setActiveCueText(matchingCue ? matchingCue.text : null);
          }
        })
        .catch(() => {
          parsedCuesRef.current = [];
          setParsedCues([]);
        });
    } else {
      parsedCuesRef.current = [];
      setParsedCues([]);
    }
  }, [selectedSubtitle, allSubtitleTracks, hlsSubtitleTracks]);

  // Hook into video.textTracks for embedded cues and suppress default browser black boxes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCueChange = () => {
      if (!selectedSubtitle) {
        setActiveCueText(null);
        return;
      }
      if (parsedCues.length > 0) return; // External cues handled by handleTimeUpdate

      let foundText: string | null = null;
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (track.mode === 'showing') {
          track.mode = 'hidden';
        }
        if (track.mode === 'hidden' && track.activeCues && track.activeCues.length > 0) {
          const cueTexts: string[] = [];
          for (let j = 0; j < track.activeCues.length; j++) {
            const cue = track.activeCues[j] as any;
            if (cue?.text) {
              cueTexts.push(cue.text.replace(/\n/g, '<br />'));
            }
          }
          if (cueTexts.length > 0) {
            foundText = cueTexts.join('<br />');
            break;
          }
        }
      }
      if (foundText !== null) {
        setActiveCueText(foundText);
      }
    };

    const textTracks = video.textTracks;
    textTracks.addEventListener('change', handleCueChange);
    for (let i = 0; i < textTracks.length; i++) {
      textTracks[i].oncuechange = handleCueChange;
    }

    return () => {
      textTracks.removeEventListener('change', handleCueChange);
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].oncuechange = null;
      }
    };
  }, [stream, selectedSubtitle, parsedCues]);

  // 4. Auto-Resume logic once video metadata is ready
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
      // Preserve timestamp on server or quality/language switch
      video.currentTime = lastRecordedTimeRef.current;
      setCurrentTime(lastRecordedTimeRef.current);
    }
  };

  // 5. Video Event Handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const cur = video.currentTime;
    setCurrentTime(cur);

    // Sync active subtitle cue
    const cues = parsedCuesRef.current;
    if (cues.length > 0 && selectedSubtitle) {
      const matchingCue = cues.find((c) => c.start <= cur && cur <= c.end);
      setActiveCueText(matchingCue ? matchingCue.text : null);
    } else if (!selectedSubtitle) {
      setActiveCueText(null);
    }

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
      // PiP not supported
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Derive all available quality options seamlessly
  const qualityOptions = useMemo(() => {
    const set = new Set<string>(['Auto']);

    // 1. From HLS levels
    if (hlsQualityLevels.length > 0) {
      hlsQualityLevels.forEach((lvl) => set.add(lvl.label));
    }

    // 2. From availableSources in active language
    const currentLangSources = availableSources.filter((s) => s.language === selectedLanguage);
    currentLangSources.forEach((s) => {
      if (s.quality) set.add(s.quality);
    });

    // 3. Fallback ladder if only Auto exists
    if (set.size <= 1) {
      STANDARD_FALLBACK_QUALITIES.forEach((q) => set.add(q));
    }

    return Array.from(set);
  }, [hlsQualityLevels, availableSources, selectedLanguage]);

  // Subtitle selection handler
  const handleSelectSubtitle = (subId: string | null) => {
    setSelectedSubtitle(subId);
    localStorage.setItem('ta_player_subtitle_lang', subId || 'off');

    if (!subId) {
      if (hlsRef.current) hlsRef.current.subtitleTrack = -1;
      setActiveCueText(null);
      setParsedCues([]);
    } else if (subId.startsWith('hls_')) {
      const idx = parseInt(subId.replace('hls_', ''), 10);
      if (hlsRef.current && !isNaN(idx)) {
        hlsRef.current.subtitleTrack = idx;
      }
    }

    setSettingsTab('main');
  };

  // Subtitle styling updater
  const updateSubtitleStyle = (updates: Partial<SubtitleStyleConfig>) => {
    setSubtitleStyle((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('ta_player_subtitle_style', JSON.stringify(next));
      return next;
    });
  };

  // Quality selection handler
  const handleSelectQuality = (qual: string) => {
    setActiveQuality(qual);
    localStorage.setItem('ta_player_quality', qual);

    // If HLS instance is active and quality matches an HLS level
    if (hlsRef.current) {
      if (qual === 'Auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        const hlsMatch = hlsQualityLevels.find((lvl) => lvl.label === qual);
        if (hlsMatch) {
          hlsRef.current.currentLevel = hlsMatch.level;
        }
      }
    }

    onSelectQuality?.(qual);
    setSettingsTab('main');
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

  // State: Provider dead / video unavailable
  if (stream?.type === 'error') {
    return (
      <div className="w-full aspect-video-player rounded-3xl overflow-hidden bg-[#0c101c] border border-red-500/20 flex flex-col items-center justify-center p-6 text-center mb-6 shadow-2xl relative">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-500/10">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-white text-lg font-['Outfit'] mb-1">
          Video no disponible en {stream.server_name}
        </h3>
        <p className="text-slate-400 text-xs max-w-md mb-3">
          {stream.error_message ||
            'El archivo de video fue dado de baja o no se encuentra disponible en este servidor de origen.'}
        </p>
        <span className="text-[11px] text-indigo-400 font-medium bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/20">
          Por favor selecciona otra pista de audio o calidad en los ajustes del reproductor.
        </span>
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
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
        onPlay={() => {
          setIsPlaying(true);
          handleTimeUpdate();
        }}
        onPause={() => {
          setIsPlaying(false);
          handleTimeUpdate();
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
          console.warn('[TotalAnimePlayer] Native video error on source:', selectedSource?.server_name);
          setStream({
            source_id: selectedSource?.id,
            provider: selectedSource?.provider || 'error',
            server_name: selectedSource?.server_name || 'Servidor',
            type: 'error',
            url: '',
            error_message: 'El flujo de video no pudo ser reproducido o la conexión con el servidor fue rechazada.',
          });
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeked={handleTimeUpdate}
        onSeeking={handleTimeUpdate}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* CUSTOM ANIME SUBTITLE RENDERER */}
      {selectedSubtitle && activeCueText && (
        <div
          className={`absolute left-0 right-0 text-center pointer-events-none z-[35] px-6 transition-all duration-150 ${
            showControls ? 'bottom-20 sm:bottom-24' : 'bottom-6 sm:bottom-8'
          }`}
        >
          <span
            className={`inline-block font-bold tracking-wide transition-all ${
              subtitleStyle.background === 'box'
                ? 'bg-black/85 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-xs shadow-2xl'
                : ''
            }`}
            style={{
              color: subtitleStyle.color,
              fontSize:
                subtitleStyle.fontSize === 'small'
                  ? 'clamp(13px, 1.8vw, 16px)'
                  : subtitleStyle.fontSize === 'large'
                  ? 'clamp(20px, 3.2vw, 28px)'
                  : 'clamp(16px, 2.5vw, 22px)',
              textShadow:
                subtitleStyle.background === 'box'
                  ? 'none'
                  : '0 0 4px #000, 0 0 8px #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.95)',
              fontFamily: 'Outfit, Inter, system-ui, sans-serif',
              lineHeight: 1.35,
            }}
            dangerouslySetInnerHTML={{ __html: activeCueText }}
          />
        </div>
      )}

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
                <div className="absolute right-0 bottom-full mb-2 w-60 p-2.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl z-40 animate-fade-in text-xs max-h-[380px] overflow-y-auto">
                  {/* MAIN SETTINGS MENU */}
                  {settingsTab === 'main' && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                        Ajustes
                      </div>

                      {/* 1. Audio Track Submenu Button */}
                      <button
                        onClick={() => setSettingsTab('audio')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Pista de audio</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <span>
                            {selectedLanguage === 'dub' ? 'Doblaje Latino' : 'Subtitulado'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* 2. Subtitles Submenu Button */}
                      <button
                        onClick={() => setSettingsTab('subtitles')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Subtítulos</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <span>{selectedSubtitleLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* 3. Quality Submenu Button */}
                      <button
                        onClick={() => setSettingsTab('quality')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Calidad</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <span>{activeQuality}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* 4. Speed Submenu Button */}
                      <button
                        onClick={() => setSettingsTab('speed')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Velocidad</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <span>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* AUDIO TRACK SUBMENU */}
                  {settingsTab === 'audio' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors mb-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Volver</span>
                      </button>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
                        Seleccionar Audio
                      </div>

                      {/* Source-level languages */}
                      {availableLanguages.map((lang) => {
                        const isSelected = selectedLanguage === lang;
                        const label =
                          lang === 'dub'
                            ? 'Doblaje (Español Latino)'
                            : 'Subtitulado (Original/Japonés)';
                        return (
                          <button
                            key={lang}
                            onClick={() => {
                              onSelectLanguage?.(lang);
                              setSettingsTab('main');
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                              isSelected
                                ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30'
                                : 'hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <span>{label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        );
                      })}

                      {/* Embedded HLS audio tracks if stream has multiple */}
                      {hlsAudioTracks.length > 1 && (
                        <>
                          <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pt-2 pb-1 border-b border-slate-800">
                            Pistas HLS
                          </div>
                          {hlsAudioTracks.map((track) => {
                            const isSelected = activeHlsAudioTrack === track.id;
                            return (
                              <button
                                key={`hls-audio-${track.id}`}
                                onClick={() => {
                                  if (hlsRef.current) {
                                    hlsRef.current.audioTrack = track.id;
                                    setActiveHlsAudioTrack(track.id);
                                  }
                                  setSettingsTab('main');
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30'
                                    : 'hover:bg-white/10 text-slate-200'
                                }`}
                              >
                                <span>{track.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}

                  {/* SUBTITLES SUBMENU */}
                  {settingsTab === 'subtitles' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors mb-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Volver</span>
                      </button>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
                        Subtítulos
                      </div>

                      {/* Off Option */}
                      <button
                        onClick={() => handleSelectSubtitle(null)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                          selectedSubtitle === null
                            ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30'
                            : 'hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <span>Desactivados</span>
                        {selectedSubtitle === null && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>

                      {/* Dynamic Subtitle Tracks */}
                      {allSubtitleTracks.map((track) => {
                        const isSelected =
                          selectedSubtitle === track.id ||
                          selectedSubtitle === track.language ||
                          (selectedSubtitle === 'es' && (track.language === 'es' || track.label.toLowerCase().includes('español'))) ||
                          (selectedSubtitle === 'en' && (track.language === 'en' || track.label.toLowerCase().includes('english')));

                        return (
                          <button
                            key={track.id}
                            onClick={() => handleSelectSubtitle(track.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                              isSelected
                                ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30'
                                : 'hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{track.label}</span>
                              {track.language && track.language !== 'und' && (
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                                  {track.language}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        );
                      })}

                      {allSubtitleTracks.length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No se detectaron pistas de subtítulos para esta fuente
                        </div>
                      )}

                      {/* Subtitle Style Customization Button */}
                      <button
                        onClick={() => setSettingsTab('subtitle-style')}
                        className="w-full flex items-center justify-between p-2 mt-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/20 transition-colors font-medium text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5" />
                          <span>Personalizar subtítulos...</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* SUBTITLE STYLE CUSTOMIZATION */}
                  {settingsTab === 'subtitle-style' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setSettingsTab('subtitles')}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors mb-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Volver a Subtítulos</span>
                      </button>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
                        Estilo de Subtítulos
                      </div>

                      {/* Size Selector */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 px-2">Tamaño de Texto</span>
                        <div className="grid grid-cols-3 gap-1 px-1">
                          {(['small', 'medium', 'large'] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => updateSubtitleStyle({ fontSize: size })}
                              className={`py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                                subtitleStyle.fontSize === size
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              {size === 'small' ? 'Chico' : size === 'large' ? 'Grande' : 'Normal'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Selector */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 px-2">Color</span>
                        <div className="flex items-center gap-1.5 px-2">
                          {[
                            { label: 'Blanco', value: '#ffffff' },
                            { label: 'Amarillo', value: '#facc15' },
                            { label: 'Cyan', value: '#38bdf8' },
                          ].map((col) => (
                            <button
                              key={col.value}
                              onClick={() => updateSubtitleStyle({ color: col.value })}
                              style={{ backgroundColor: col.value }}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                subtitleStyle.color === col.value
                                  ? 'border-indigo-400 scale-110 shadow-lg'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              title={col.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Background / Effect Selector */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 px-2">Sombra / Fondo</span>
                        <div className="grid grid-cols-2 gap-1 px-1">
                          {[
                            { label: 'Sombra Negra', value: 'shadow' as const },
                            { label: 'Caja Oscura', value: 'box' as const },
                          ].map((bg) => (
                            <button
                              key={bg.value}
                              onClick={() => updateSubtitleStyle({ background: bg.value })}
                              className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                                subtitleStyle.background === bg.value
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              {bg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QUALITY SUBMENU */}
                  {settingsTab === 'quality' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors mb-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Volver</span>
                      </button>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
                        Calidad de Video
                      </div>
                      {qualityOptions.map((qual) => (
                        <button
                          key={qual}
                          onClick={() => handleSelectQuality(qual)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                            activeQuality === qual
                              ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30'
                              : 'hover:bg-white/10 text-slate-200'
                          }`}
                        >
                          <span>{qual}</span>
                          {activeQuality === qual && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PLAYBACK SPEED SUBMENU */}
                  {settingsTab === 'speed' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors mb-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Volver</span>
                      </button>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
                        Velocidad
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        {SPEED_OPTIONS.map((rate) => (
                          <button
                            key={rate}
                            onClick={() => {
                              setPlaybackRate(rate);
                              localStorage.setItem('ta_player_rate', String(rate));
                              setSettingsTab('main');
                            }}
                            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                              playbackRate === rate
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
