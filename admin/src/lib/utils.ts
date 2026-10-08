import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `hace ${diffDays}d`;
    if (diffHours > 0) return `hace ${diffHours}h`;
    if (diffMins > 0) return `hace ${diffMins}m`;
    return 'hace unos segundos';
  } catch {
    return dateString;
  }
}

/**
 * Universal Avatar URL resolver with privacy proxy support
 */
export function getAvatarUrl(avatarPathOrUrl?: string | null): string {
  const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
  const apiBase = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

  if (!avatarPathOrUrl || avatarPathOrUrl.trim() === '') {
    return `${apiBase}/avatars/default-avatar.png`;
  }

  // If already an external URL (e.g. Google OAuth photo or custom host)
  if (avatarPathOrUrl.startsWith('http://') || avatarPathOrUrl.startsWith('https://')) {
    if (avatarPathOrUrl.includes('/storage/v1/object/public/avatars/')) {
      const parts = avatarPathOrUrl.split('/storage/v1/object/public/avatars/');
      const filename = parts[1]?.split('?')[0];
      return `${apiBase}/avatars/${filename}`;
    }
    return avatarPathOrUrl;
  }

  // If it's a relative filename stored in DB (e.g. 'user-1.jpeg', 'default-avatar.png')
  const cleanFilename = avatarPathOrUrl.startsWith('/') ? avatarPathOrUrl.slice(1) : avatarPathOrUrl;
  return `${apiBase}/avatars/${cleanFilename}`;
}
