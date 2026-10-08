import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.js';
import { AvatarItem } from '../types/index.js';

export function useAvatars() {
  const queryClient = useQueryClient();

  const query = useQuery<AvatarItem[]>({
    queryKey: ['admin-avatars-list'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; avatars: AvatarItem[] }>('/avatars');
      return response.data.avatars || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post<{ success: boolean; avatars: AvatarItem[]; message: string }>(
        '/avatars/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-avatars-list'] });
      queryClient.invalidateQueries({ queryKey: ['avatars-list'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch<{ success: boolean; avatar: AvatarItem; message: string }>(
        `/avatars/${id}/default`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-avatars-list'] });
      queryClient.invalidateQueries({ queryKey: ['avatars-list'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/avatars/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-avatars-list'] });
      queryClient.invalidateQueries({ queryKey: ['avatars-list'] });
    },
  });

  return {
    avatars: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    uploadAvatars: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    setDefaultAvatar: setDefaultMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending,
    deleteAvatar: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
