import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './core/hooks';
import { AppShell } from './app/components';
import { DashboardSelector, Login, NotFound, AdminDashboard } from './app/pages';
import { ClientList, ClientDetail } from './verticals/client-demographics';
import { CarePlanList, CarePlanDetail, TaskList } from './verticals/care-plans';
import { CreateCarePlanPage, CreateFromTemplatePage, CustomizeTemplatePage } from './verticals/care-plans';
import { EVVRecordList, EVVRecordDetail } from './verticals/time-tracking-evv';
import { InvoiceList, InvoiceDetail } from './verticals/billing-invoicing';
import { PayRunList, PayRunDetail } from './verticals/payroll-processing';
import { OpenShiftList, OpenShiftDetail } from './verticals/shift-matching';
import { AdminDashboard as AnalyticsAdminDashboard, CoordinatorDashboard, ReportsPage } from './app/pages/analytics';
import { DemoModeBar } from './demo';
import { FamilyPortalLayout } from './app/layouts/FamilyPortalLayout';
import {
  FamilyDashboard,
  FamilySettings,
  ActivityPage,
  MessagesPage,
  NotificationsPage,
  SchedulePage,
  CarePlanPage,
  HealthUpdatesPage
} from './verticals/family-engagement/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect family users to family portal
  if (user?.roles.includes('FAMILY')) {
    return <Navigate to="/family-portal" replace />;
  }

  return <>{children}</>;
};

const FamilyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-family users to admin dashboard
  if (!user?.roles.includes('FAMILY')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    // Route to appropriate dashboard based on role
    if (user?.roles.includes('FAMILY')) {
      return <Navigate to="/family-portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

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
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : user?.roles.includes('FAMILY') ? (
            <Navigate to="/family-portal" replace />
          ) : (
            <AppShell>
              <DashboardSelector />
            </AppShell>
          )
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
        path="/shift-matching"
        element={
          <ProtectedRoute>
            <AppShell>
              <OpenShiftList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shift-matching/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <OpenShiftDetail />
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
        path="/care-plans/from-template"
        element={
          <ProtectedRoute>
            <AppShell>
              <CreateFromTemplatePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/care-plans/from-template/:templateId"
        element={
          <ProtectedRoute>
            <AppShell>
              <CustomizeTemplatePage />
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
        path="/time-tracking"
        element={
          <ProtectedRoute>
            <AppShell>
              <EVVRecordList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/time-tracking/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <EVVRecordDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <AppShell>
              <InvoiceList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <InvoiceDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <AppShell>
              <PayRunList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/runs/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <PayRunDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AppShell>
              <AdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/admin"
        element={
          <ProtectedRoute>
            <AppShell>
              <AnalyticsAdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/coordinator"
        element={
          <ProtectedRoute>
            <AppShell>
              <CoordinatorDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/reports"
        element={
          <ProtectedRoute>
            <AppShell>
              <ReportsPage />
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
      {/* Family Portal Routes */}
      <Route
        path="/family-portal"
        element={
          <FamilyProtectedRoute>
            <FamilyPortalLayout />
          </FamilyProtectedRoute>
        }
      >
        <Route index element={<FamilyDashboard />} />
        <Route path="settings" element={<FamilySettings />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:threadId" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="care-plan" element={<CarePlanPage />} />
        <Route path="health-updates" element={<HealthUpdatesPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DemoModeBar />
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
