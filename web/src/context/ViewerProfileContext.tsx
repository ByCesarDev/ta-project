import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext.js';
import { supabase } from '../lib/supabase.js';

export interface ViewerProfile {
  id: string;
  account_id: string;
  name: string;
  display_name: string;
  username: string; // Unique public handle, e.g. "nelis"
  avatar_url: string | null;
  bio?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProfileData {
  displayName?: string;
  name?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface UpdateProfileData {
  displayName?: string;
  name?: string;
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface ViewerProfileContextType {
  profiles: ViewerProfile[];
  activeProfile: ViewerProfile | null;
  isLoading: boolean;
  selectProfile: (profileId: string) => void;
  createProfile: (input: string | CreateProfileData, maybeAvatar?: string | null) => Promise<ViewerProfile>;
  updateProfile: (profileId: string, data: UpdateProfileData) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  isSelectorModalOpen: boolean;
  openSelectorModal: () => void;
  closeSelectorModal: () => void;
  isManageModalOpen: boolean;
  openManageModal: () => void;
  closeManageModal: () => void;
}

const ViewerProfileContext = createContext<ViewerProfileContextType | undefined>(undefined);

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

export const ViewerProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [profiles, setProfiles] = useState<ViewerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ViewerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState<boolean>(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);

  const openSelectorModal = useCallback(() => setIsSelectorModalOpen(true), []);
  const closeSelectorModal = useCallback(() => setIsSelectorModalOpen(false), []);
  const openManageModal = useCallback(() => setIsManageModalOpen(true), []);
  const closeManageModal = useCallback(() => setIsManageModalOpen(false), []);

  /**
   * Fetches viewer profiles from API
   */
  const fetchProfiles = useCallback(async (accountId: string) => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setProfiles([]);
        setActiveProfile(null);
        return;
      }

      const res = await fetch(`${API_BASE}/viewer-profiles`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Error al cargar perfiles');
      }

      const data = await res.json();
      const list: ViewerProfile[] = (data.profiles || []).map((p: any) => ({
        ...p,
        display_name: p.display_name || p.name || 'Perfil',
        username: p.username || '',
        bio: p.bio || null,
      }));

      setProfiles(list);

      // Determine active profile
      const storedProfileId = localStorage.getItem(`ta_active_viewer_profile_${accountId}`);
      let currentActive: ViewerProfile | null = null;

      if (storedProfileId) {
        currentActive = list.find((p) => p.id === storedProfileId) || null;
      }

      if (!currentActive) {
        currentActive = list.find((p) => p.is_default) || list[0] || null;
      }

      setActiveProfile(currentActive);
      if (currentActive) {
        localStorage.setItem(`ta_active_viewer_profile_${accountId}`, currentActive.id);
      }
    } catch (err) {
      console.error('[ViewerProfileProvider] Failed to fetch viewer profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload profiles whenever authenticated user changes
  useEffect(() => {
    if (user?.id) {
      fetchProfiles(user.id);
    } else {
      setProfiles([]);
      setActiveProfile(null);
      setIsLoading(false);
    }
  }, [user?.id, fetchProfiles]);

  /**
   * Selects and switches active viewer profile
   */
  const selectProfile = useCallback(
    (profileId: string) => {
      const found = profiles.find((p) => p.id === profileId);
      if (!found) return;

      setActiveProfile(found);
      if (user?.id) {
        localStorage.setItem(`ta_active_viewer_profile_${user.id}`, found.id);
      }

      // Invalidate relevant queries so the UI immediately refreshes with new profile data
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['saved-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episode-comments'] });

      closeSelectorModal();
      closeManageModal();
    },
    [profiles, user?.id, queryClient, closeSelectorModal, closeManageModal]
  );

  /**
   * Creates a new profile
   */
  const createProfile = useCallback(
    async (
      input: string | CreateProfileData,
      maybeAvatar?: string | null
    ): Promise<ViewerProfile> => {
      const token = await getAuthToken();
      if (!token) throw new Error('No autorizado');

      let payload: { name: string; display_name: string; username?: string; avatar_url: string | null; bio?: string | null };
      if (typeof input === 'string') {
        payload = {
          name: input,
          display_name: input,
          avatar_url: maybeAvatar || null,
        };
      } else {
        const nameVal = input.displayName || input.name || '';
        payload = {
          name: nameVal,
          display_name: nameVal,
          username: input.username,
          avatar_url: input.avatarUrl || null,
          bio: input.bio || null,
        };
      }

      const res = await fetch(`${API_BASE}/viewer-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al crear perfil');
      }

      const data = await res.json();
      const newProfile: ViewerProfile = {
        ...data.profile,
        display_name: data.profile.display_name || data.profile.name || 'Perfil',
        username: data.profile.username || '',
        bio: data.profile.bio || null,
      };

      setProfiles((prev) => [...prev, newProfile]);
      return newProfile;
    },
    []
  );

  /**
   * Updates an existing profile
   */
  const updateProfile = useCallback(
    async (profileId: string, data: UpdateProfileData) => {
      const token = await getAuthToken();
      if (!token) throw new Error('No autorizado');

      const payload = {
        name: data.displayName || data.name,
        display_name: data.displayName || data.name,
        username: data.username,
        avatar_url: data.avatar_url,
        bio: data.bio,
      };

      const res = await fetch(`${API_BASE}/viewer-profiles/${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar perfil');
      }

      const resJson = await res.json();
      const updatedProfile: ViewerProfile = {
        ...resJson.profile,
        display_name: resJson.profile.display_name || resJson.profile.name || 'Perfil',
        username: resJson.profile.username || '',
        bio: resJson.profile.bio || null,
      };

      setProfiles((prev) => prev.map((p) => (p.id === profileId ? updatedProfile : p)));
      if (activeProfile?.id === profileId) {
        setActiveProfile(updatedProfile);
      }

      // Invalidate queries if profile details updated
      queryClient.invalidateQueries({ queryKey: ['episode-comments'] });
    },
    [activeProfile?.id, queryClient]
  );

  /**
   * Deletes a profile
   */
  const deleteProfile = useCallback(
    async (profileId: string) => {
      const token = await getAuthToken();
      if (!token) throw new Error('No autorizado');

      const res = await fetch(`${API_BASE}/viewer-profiles/${encodeURIComponent(profileId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al eliminar perfil');
      }

      setProfiles((prev) => prev.filter((p) => p.id !== profileId));

      // If active profile was deleted, switch to default profile
      if (activeProfile?.id === profileId) {
        const remaining = profiles.filter((p) => p.id !== profileId);
        const fallback = remaining.find((p) => p.is_default) || remaining[0] || null;
        setActiveProfile(fallback);
        if (fallback && user) {
          localStorage.setItem(`ta_active_viewer_profile_${user.id}`, fallback.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['saved-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episode-comments'] });
    },
    [activeProfile?.id, profiles, user, queryClient]
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      isLoading,
      selectProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isSelectorModalOpen,
      openSelectorModal,
      closeSelectorModal,
      isManageModalOpen,
      openManageModal,
      closeManageModal,
    }),
    [
      profiles,
      activeProfile,
      isLoading,
      selectProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isSelectorModalOpen,
      openSelectorModal,
      closeSelectorModal,
      isManageModalOpen,
      openManageModal,
      closeManageModal,
    ]
  );

  return <ViewerProfileContext.Provider value={value}>{children}</ViewerProfileContext.Provider>;
};

export const useViewerProfile = (): ViewerProfileContextType => {
  const context = useContext(ViewerProfileContext);
  if (!context) {
    throw new Error('useViewerProfile must be used within a ViewerProfileProvider');
  }
  return context;
};
