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

export function formatStatusLabel(status?: string): { label: string; color: string } {
  switch (status?.toLowerCase()) {
    case 'releasing':
    case 'emision':
      return { label: 'En Emisión', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'finished':
    case 'finalizado':
      return { label: 'Finalizado', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
    case 'not_yet_released':
    case 'proximamente':
      return { label: 'Próximamente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    default:
      return { label: status || 'Desconocido', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  }
}

export function truncateText(text: string, max: number = 140): string {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max).trim() + '...';
}
