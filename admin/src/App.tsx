import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { AdminLayout } from './components/layout/AdminLayout.js';

import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AnimesPage } from './pages/AnimesPage.js';
import { EpisodesPage } from './pages/EpisodesPage.js';
import { JobsPage } from './pages/JobsPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Staff Routes (Moderator + Admin) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/animes" element={<AnimesPage />} />
              <Route path="/animes/:id/episodes" element={<EpisodesPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Admin-Only Routes */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
