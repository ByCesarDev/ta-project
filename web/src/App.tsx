import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ViewerProfileProvider } from './context/ViewerProfileContext.js';
import { UserPreviewProvider } from './context/UserPreviewContext.js';

// Pages
import { HomePage } from './pages/HomePage.js';
import { CatalogPage } from './pages/CatalogPage.js';
import { AnimeDetailPage } from './pages/AnimeDetailPage.js';
import { WatchPage } from './pages/WatchPage.js';
import { WatchlistPage } from './pages/WatchlistPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { ProfilesPage } from './pages/ProfilesPage.js';
import { AccountSettingsPage } from './pages/AccountSettingsPage.js';
import { PublicUserProfilePage } from './pages/PublicUserProfilePage.js';
import { AboutPage } from './pages/AboutPage.js';
import { TermsPage } from './pages/TermsPage.js';
import { PrivacyPage } from './pages/PrivacyPage.js';
import { CopyrightPage } from './pages/CopyrightPage.js';
import { DmcaPage } from './pages/DmcaPage.js';
import { FaqPage } from './pages/FaqPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { ProfileSelectorModal } from './components/profiles/ProfileSelectorModal.js';
import { ManageProfilesModal } from './components/profiles/ManageProfilesModal.js';
import { UserPreviewModal } from './components/modals/UserPreviewModal.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewerProfileProvider>
          <UserPreviewProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/directory" element={<CatalogPage />} />
                <Route path="/anime/:slug" element={<AnimeDetailPage />} />
                <Route path="/watch/:slug/:episodeId" element={<WatchPage />} />
                <Route path="/watch/:slug" element={<WatchPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profiles" element={<ProfilesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/u/:username" element={<PublicUserProfilePage />} />
                <Route path="/settings/account" element={<AccountSettingsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/copyright" element={<CopyrightPage />} />
                <Route path="/dmca" element={<DmcaPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <ProfileSelectorModal />
              <ManageProfilesModal />
              <UserPreviewModal />
            </BrowserRouter>
          </UserPreviewProvider>
        </ViewerProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
