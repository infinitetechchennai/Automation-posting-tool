import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { AIContentStudioPage } from './pages/AIContentStudioPage';
import { ImageStudioPage } from './pages/ImageStudioPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ContentCalendarPage } from './pages/ContentCalendarPage';
import { ScheduledPostsPage } from './pages/ScheduledPostsPage';
import { PostPreviewPage } from './pages/PostPreviewPage';
import { PublishedPostsPage } from './pages/PublishedPostsPage';
import { DraftsPage } from './pages/DraftsPage';
import { FailedPostsPage } from './pages/FailedPostsPage';
import { SocialAccountsPage } from './pages/SocialAccountsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ContentTemplatesPage } from './pages/ContentTemplatesPage';
import { BrandSettingsPage } from './pages/BrandSettingsPage';
import { AISettingsPage } from './pages/AISettingsPage';
import { ApplicationSettingsPage } from './pages/ApplicationSettingsPage';
import { BulkAutoPostPage } from './pages/BulkAutoPostPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Protected Route wrapper with fallback
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  // In development mode, if user isn't logged in yet, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/create-post" element={<CreatePostPage />} />
                <Route path="/bulk-schedule" element={<BulkAutoPostPage />} />
                <Route path="/ai-studio" element={<AIContentStudioPage />} />
                <Route path="/image-studio" element={<ImageStudioPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/calendar" element={<ContentCalendarPage />} />
                <Route path="/scheduled" element={<ScheduledPostsPage />} />
                <Route path="/preview" element={<PostPreviewPage />} />
                <Route path="/preview/:postId" element={<PostPreviewPage />} />
                <Route path="/published" element={<PublishedPostsPage />} />
                <Route path="/drafts" element={<DraftsPage />} />
                <Route path="/failed" element={<FailedPostsPage />} />
                <Route path="/accounts" element={<SocialAccountsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/templates" element={<ContentTemplatesPage />} />
                <Route path="/brand-settings" element={<BrandSettingsPage />} />
                <Route path="/ai-settings" element={<AISettingsPage />} />
                <Route path="/app-settings" element={<ApplicationSettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
