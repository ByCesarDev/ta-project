import { useQuery } from '@tanstack/react-query';
import { AvatarItem } from '../types/index.js';

export function useAvatars() {
  const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
  const apiBase = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

  return useQuery<AvatarItem[]>({
    queryKey: ['avatars-list'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/avatars`);
      if (!res.ok) {
        throw new Error('Error al cargar la lista de avatares');
      }
      const data = await res.json();
      return (data.avatars || []) as AvatarItem[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}
