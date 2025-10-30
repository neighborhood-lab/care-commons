import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './core/hooks';
import { AppShell } from './app/components';
import { Dashboard, Login, NotFound } from './app/pages';
import { ClientList, ClientDetail } from './verticals/client-demographics';
import { CarePlanList, CarePlanDetail, TaskList } from './verticals/care-plans';
import { CreateCarePlanPage } from './verticals/care-plans';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <AppShell>
              <ClientList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <ClientDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregivers/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Caregivers Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scheduling/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Scheduling Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/care-plans"
        element={
          <ProtectedRoute>
            <AppShell>
              <CarePlanList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/care-plans/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <CreateCarePlanPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/care-plans/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <CarePlanDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <AppShell>
              <TaskList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/time-tracking/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Time Tracking Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Billing Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
