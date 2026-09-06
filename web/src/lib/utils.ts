import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function normalizeAnimeStatus(status?: string): string {
  if (!status) return '';
  const lower = status.trim().toLowerCase();
  if (lower === 'releasing' || lower === 'emision' || lower === 'en_emision' || lower === 'en emisión') {
    return 'RELEASING';
  }
  if (lower === 'finished' || lower === 'finalizado') {
    return 'FINISHED';
  }
  if (lower === 'not_yet_released' || lower === 'proximamente' || lower === 'próximamente') {
    return 'NOT_YET_RELEASED';
  }
  return status.toUpperCase();
}

export function formatStatusLabel(status?: string): { label: string; color: string } {
  const normalized = normalizeAnimeStatus(status);
  switch (normalized) {
    case 'RELEASING':
      return { label: 'En Emisión', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'FINISHED':
      return { label: 'Finalizado', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
    case 'NOT_YET_RELEASED':
      return { label: 'Próximamente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    default:
      return { label: status || 'Desconocido', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  }
}

export function truncateText(text: string, max: number = 140): string {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max).trim() + '...';
}

/**
 * Returns true only if a valid playable embed URL is available.
 * Used to avoid running intervals or saving viewing history when no video exists.
 */
export function canTrackPlayback(source?: { embed_url?: string | null } | null): boolean {
  if (!source || !source.embed_url) return false;
  return source.embed_url.trim().length > 0;
}

/**
 * Calculates previous and next episode numbers from the actual episode array,
 * preventing 404s on series with non-consecutive episode numbers or gaps.
 */
export function getAdjacentEpisodes(
  episodes: { episode_number: number }[],
  currentEpisodeNumber: number,
  totalEpisodes?: number
): { prev: number | null; next: number | null } {
  if (!episodes || episodes.length === 0) {
    const hasNext =
      totalEpisodes !== undefined && totalEpisodes > 0
        ? currentEpisodeNumber < totalEpisodes
        : true;
    return {
      prev: currentEpisodeNumber > 1 ? currentEpisodeNumber - 1 : null,
      next: hasNext ? currentEpisodeNumber + 1 : null,
    };
  }

  const sortedNumbers = Array.from(new Set(episodes.map((e) => e.episode_number))).sort(
    (a, b) => a - b
  );
  const currentIndex = sortedNumbers.indexOf(currentEpisodeNumber);

  if (currentIndex === -1) {
    // Current not in list: find closest smaller and closest larger
    const smaller = sortedNumbers.filter((n) => n < currentEpisodeNumber);
    const larger = sortedNumbers.filter((n) => n > currentEpisodeNumber);
    return {
      prev: smaller.length > 0 ? smaller[smaller.length - 1] : null,
      next: larger.length > 0 ? larger[0] : null,
    };
  }

  return {
    prev: currentIndex > 0 ? sortedNumbers[currentIndex - 1] : null,
    next: currentIndex < sortedNumbers.length - 1 ? sortedNumbers[currentIndex + 1] : null,
  };
}

