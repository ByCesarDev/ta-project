import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../lib/api.js';

export interface PublicViewerProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_default: boolean;
  created_at: string;
  stats: {
    animes_watched: number;
    episodes_watched: number;
  };
}

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

export function usePublicProfile(identifier?: string | null) {
  const clean = identifier ? identifier.trim().replace(/^@+/, '') : null;

  return useQuery<PublicViewerProfileData | null>({
    queryKey: ['public-viewer-profile', clean],
    queryFn: async () => {
      if (!clean) return null;

      const res = await fetchWithAuth(`${API_BASE}/viewer-profiles/public/${encodeURIComponent(clean)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        throw new Error('Error al cargar la información del perfil.');
      }

      const data = await res.json();
      return (data.profile || null) as PublicViewerProfileData | null;
    },
    enabled: Boolean(clean && clean.length > 0),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}
