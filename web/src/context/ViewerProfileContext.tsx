import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext.js';
import { supabase } from '../lib/supabase.js';

export interface ViewerProfile {
  id: string;
  account_id: string;
  name: string;
  avatar_url: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ViewerProfileContextType {
  profiles: ViewerProfile[];
  activeProfile: ViewerProfile | null;
  isLoading: boolean;
  selectProfile: (profileId: string) => void;
  createProfile: (name: string, avatarUrl?: string | null) => Promise<ViewerProfile>;
  updateProfile: (profileId: string, data: { name?: string; avatar_url?: string | null }) => Promise<void>;
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
      const list: ViewerProfile[] = data.profiles || [];
      setProfiles(list);

      // Restore active profile from localStorage or select default
      const storedProfileId = localStorage.getItem(`ta_active_viewer_profile_${accountId}`);
      const found = list.find((p) => p.id === storedProfileId);

      if (found) {
        setActiveProfile(found);
      } else if (list.length > 0) {
        const defaultProfile = list.find((p) => p.is_default) || list[0];
        setActiveProfile(defaultProfile);
        localStorage.setItem(`ta_active_viewer_profile_${accountId}`, defaultProfile.id);
      } else {
        setActiveProfile(null);
      }
    } catch (err) {
      console.error('[ViewerProfileContext] Error fetching profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When authenticated user changes
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
   * Selects an active profile and invalidates queries for seamless data isolation
   */
  const selectProfile = useCallback(
    (profileId: string) => {
      if (!user) return;
      const target = profiles.find((p) => p.id === profileId);
      if (!target) return;

      setActiveProfile(target);
      localStorage.setItem(`ta_active_viewer_profile_${user.id}`, target.id);
      setIsSelectorModalOpen(false);

      // Invalidate queries so playback, favorites & saved episodes re-fetch for the new profile
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['saved-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episode-reactions'] });
    },
    [user, profiles, queryClient]
  );

  /**
   * Creates a new profile
   */
  const createProfile = useCallback(
    async (name: string, avatarUrl?: string | null): Promise<ViewerProfile> => {
      const token = await getAuthToken();
      if (!token) throw new Error('No autorizado');

      const res = await fetch(`${API_BASE}/viewer-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, avatar_url: avatarUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al crear perfil');
      }

      const data = await res.json();
      const newProfile: ViewerProfile = data.profile;

      setProfiles((prev) => [...prev, newProfile]);
      return newProfile;
    },
    []
  );

  /**
   * Updates an existing profile
   */
  const updateProfile = useCallback(
    async (profileId: string, data: { name?: string; avatar_url?: string | null }) => {
      const token = await getAuthToken();
      if (!token) throw new Error('No autorizado');

      const res = await fetch(`${API_BASE}/viewer-profiles/${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar perfil');
      }

      const resJson = await res.json();
      const updatedProfile: ViewerProfile = resJson.profile;

      setProfiles((prev) => prev.map((p) => (p.id === profileId ? updatedProfile : p)));
      if (activeProfile?.id === profileId) {
        setActiveProfile(updatedProfile);
      }
    },
    [activeProfile?.id]
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
    },
    [activeProfile?.id, profiles, user]
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

