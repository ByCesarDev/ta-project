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
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { AuthCallbackPage } from './pages/AuthCallbackPage.js';
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
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute.js';

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
                {/* Protected Application Routes: Mandatory Account Session Required */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/directory"
                  element={
                    <ProtectedRoute>
                      <CatalogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/anime/:slug"
                  element={
                    <ProtectedRoute>
                      <AnimeDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watch/:slug/:episodeId"
                  element={
                    <ProtectedRoute>
                      <WatchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watch/:slug"
                  element={
                    <ProtectedRoute>
                      <WatchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <WatchlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profiles"
                  element={
                    <ProtectedRoute>
                      <ProfilesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/u/:username"
                  element={
                    <ProtectedRoute>
                      <PublicUserProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/account"
                  element={
                    <ProtectedRoute>
                      <AccountSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Public Auth Routes: Accessible only when NOT authenticated */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnlyRoute>
                      <ForgotPasswordPage />
                    </PublicOnlyRoute>
                  }
                />

                {/* Public Standalone / Compliance Routes */}
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/copyright" element={<CopyrightPage />} />
                <Route path="/dmca" element={<DmcaPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Catch-all route */}
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
