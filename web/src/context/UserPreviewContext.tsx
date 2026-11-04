import React, { createContext, useContext, useState, useCallback } from 'react';

export interface UserPreviewTarget {
  profileId?: string | null;
  username?: string | null;
}

interface UserPreviewContextType {
  isOpen: boolean;
  target: UserPreviewTarget | null;
  openPreview: (target: UserPreviewTarget) => void;
  closePreview: () => void;
}

const UserPreviewContext = createContext<UserPreviewContextType | undefined>(undefined);

export const UserPreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<UserPreviewTarget | null>(null);

  const openPreview = useCallback((newTarget: UserPreviewTarget) => {
    if (!newTarget.profileId && !newTarget.username) return;
    setTarget(newTarget);
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setTarget(null);
  }, []);

  return (
    <UserPreviewContext.Provider value={{ isOpen, target, openPreview, closePreview }}>
      {children}
    </UserPreviewContext.Provider>
  );
};

export const useUserPreview = (): UserPreviewContextType => {
  const context = useContext(UserPreviewContext);
  if (!context) {
    throw new Error('useUserPreview must be used within a UserPreviewProvider');
  }
  return context;
};
