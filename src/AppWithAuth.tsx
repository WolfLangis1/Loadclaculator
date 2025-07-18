import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext';
import { UnifiedAppProvider } from './context/UnifiedAppContext';
import { UserSettingsProvider } from './context/UserSettingsContext';
import { TabbedInterface } from './components/TabbedInterface/TabbedInterface';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { SupabaseLoginPage } from './components/Auth/SupabaseLoginPage';
import { UserMenu } from './components/Auth/UserMenu';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Analytics } from '@vercel/analytics/react';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  console.log('ProtectedRoute: Component called');
  const { dbUser, isLoading, isAuthenticated, isGuest, supabaseUser, session } = useSupabaseAuth();

  console.log('ProtectedRoute - Auth state:', {
    isLoading,
    hasDbUser: !!dbUser,
    dbUserId: dbUser?.id,
    dbUserName: dbUser?.name,
    isAuthenticated,
    isGuest,
    hasSupabaseUser: !!supabaseUser,
    hasSession: !!session,
    supabaseUserId: supabaseUser?.id
  });

  if (isLoading) {
    console.log('ProtectedRoute - Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
          {import.meta.env.DEV && (
            <div className="mt-2 text-xs text-gray-500">
              Session: {!!session ? 'Yes' : 'No'} | 
              SupabaseUser: {!!supabaseUser ? 'Yes' : 'No'} | 
              DbUser: {!!dbUser ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!dbUser) {
    console.log('ProtectedRoute - No dbUser, redirecting to login. Auth details:', {
      hasSupabaseUser: !!supabaseUser,
      hasSession: !!session,
      isAuthenticated
    });
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - Rendering protected content for:', dbUser.name, 'type:', dbUser.is_guest ? 'guest' : 'authenticated');
  return <>{children}</>;
}

import { MainLayout } from './components/Layout/MainLayout';

// Main app layout with authentication
function AuthenticatedApp() {
  return (
    <UserSettingsProvider>
      <UnifiedAppProvider>
        <MainLayout>
          <TabbedInterface />
        </MainLayout>
      </UnifiedAppProvider>
    </UserSettingsProvider>
  );
}

// Complete load calculator app with authentication
function AppWithAuth() {
  return (
    <ErrorBoundary>
      <Router>
        <SupabaseAuthProvider>
          <Routes>
            <Route path="/login" element={<SupabaseLoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AuthenticatedApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <UserSettingsProvider>
                    <UnifiedAppProvider>
                      <MainLayout>
                        <SettingsPage />
                      </MainLayout>
                    </UnifiedAppProvider>
                  </UserSettingsProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserSettingsProvider>
                    <UnifiedAppProvider>
                      <MainLayout>
                        <ProfilePage />
                      </MainLayout>
                    </UnifiedAppProvider>
                  </UserSettingsProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/help"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
          <Analytics />
        </SupabaseAuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default AppWithAuth;