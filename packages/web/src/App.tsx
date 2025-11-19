import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './core/hooks';
import { ProtectedRoute, FamilyProtectedRoute, PublicRoute } from './core/components';
import { AppShell } from './app/components';
import { initAuthStorage } from './core/utils/auth-storage';
import { DashboardSelector, Login, Logout, Signup, NotFound, AdministratorDashboard, Settings } from './app/pages';
import { ClientList, ClientDetail, ClientDashboard } from './verticals/client-demographics';
import { CarePlanList, CarePlanDetail, TaskList } from './verticals/care-plans';
import { CreateCarePlanPage, CreateFromTemplatePage, CustomizeTemplatePage } from './verticals/care-plans';
import { EVVRecordList, EVVRecordDetail } from './verticals/time-tracking-evv';
import { InvoiceList, InvoiceDetail } from './verticals/billing-invoicing';
import { PayrollDashboard, PayRunList, PayRunDetail } from './verticals/payroll-processing';
import { OpenShiftList, OpenShiftDetail } from './verticals/shift-matching';
import { VisitList, CalendarView } from './verticals/scheduling-visits';
import { MedicationListPage } from './pages/medications/MedicationListPage';
import { IncidentListPage } from './pages/incidents/IncidentListPage';
import { CreateIncidentPage } from './pages/incidents/CreateIncidentPage';
import { AdminDashboard as AnalyticsAdminDashboard, CoordinatorDashboard, ReportsPage } from './app/pages/analytics';
import { QADashboard, AuditsPage, AuditDetailPage, CorrectiveActionsPage } from './verticals/quality-assurance';
import { CaregiverList } from './verticals/caregivers';
import { PayrollReports, CaregiverPayStubs, PayStubList, PayStubDetail, PayPeriodManagement } from './verticals/payroll-processing';
import { MatchAnalyticsDashboard } from './verticals/shift-matching';
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
import { GlobalSearch, useGlobalSearch } from './components/search/GlobalSearch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false, // Prevent aggressive refetching
      retry: (failureCount, error) => {
        // Don't retry on 429 (rate limit) or 4xx client errors
        const status = (error as any)?.response?.status;
        if (status === 429 || (status >= 400 && status < 500)) {
          return false;
        }
        // Retry once for 5xx server errors or network issues
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
    },
  },
});



function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const { isOpen, closeSearch } = useGlobalSearch();

  return (
    <>
      {isAuthenticated && <GlobalSearch isOpen={isOpen} onClose={closeSearch} />}
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
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/logout"
        element={<Logout />}
      />
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : user?.roles.includes('FAMILY') || user?.roles.includes('CLIENT') ? (
            <Navigate to="/family-portal" replace />
          ) : (
            <ProtectedRoute>
              <AppShell>
                <DashboardSelector />
              </AppShell>
            </ProtectedRoute>
          )
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute permission="clients:read">
            <AppShell>
              <ClientList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <ClientDashboard />
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
        path="/clients/:clientId/medications"
        element={
          <ProtectedRoute>
            <AppShell>
              <MedicationListPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <AppShell>
              <IncidentListPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <CreateIncidentPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregivers"
        element={
          <ProtectedRoute permission="caregivers:read">
            <AppShell>
              <CaregiverList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scheduling"
        element={
          <ProtectedRoute>
            <AppShell>
              <VisitList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scheduling/calendar"
        element={
          <ProtectedRoute>
            <AppShell>
              <CalendarView />
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
        path="/shift-matching/analytics"
        element={
          <ProtectedRoute>
            <AppShell>
              <MatchAnalyticsDashboard />
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
          <ProtectedRoute permission="tasks:read">
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
          <ProtectedRoute permission="billing:read">
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
              <PayrollDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/runs"
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
        path="/payroll/reports"
        element={
          <ProtectedRoute>
            <AppShell>
              <PayrollReports />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/pay-stubs"
        element={
          <ProtectedRoute>
            <AppShell>
              <PayStubList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/pay-stubs/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <PayStubDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/caregivers/:caregiverId/pay-stubs"
        element={
          <ProtectedRoute>
            <AppShell>
              <CaregiverPayStubs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/pay-periods"
        element={
          <ProtectedRoute>
            <AppShell>
              <PayPeriodManagement />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            requiredRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'ADMIN']}
          >
            <AppShell>
              <AdministratorDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/admin"
        element={
          <ProtectedRoute
            requiredRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'ADMIN']}
          >
            <AppShell>
              <AnalyticsAdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/coordinator"
        element={
          <ProtectedRoute
            requiredRoles={['COORDINATOR', 'SUPER_ADMIN', 'ORG_ADMIN']}
          >
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
        path="/quality-assurance"
        element={
          <ProtectedRoute permission="audits:view">
            <AppShell>
              <QADashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quality-assurance/audits"
        element={
          <ProtectedRoute>
            <AppShell>
              <AuditsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quality-assurance/audits/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <AuditDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quality-assurance/corrective-actions"
        element={
          <ProtectedRoute>
            <AppShell>
              <CorrectiveActionsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Settings />
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
    </>
  );
}

function App() {
  // Initialize auth storage checks (demo mode: detect stale data from DB resets)
  React.useEffect(() => {
    initAuthStorage();
  }, []);

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
