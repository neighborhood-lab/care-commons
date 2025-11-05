/**
 * Showcase App Entry Point
 *
 * This is the entry point for the GitHub Pages showcase demo.
 * It wraps the main App with the ShowcaseApiProvider to enable
 * in-browser demo mode without requiring a backend server.
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ApiProviderProvider, getApiProviderConfigFromEnv } from './core/providers';
import { ShowcaseControls } from './core/components/showcase';
import { AppShell } from './app/components';
import { Dashboard, NotFound, AdminDashboard } from './app/pages';
import { ClientList, ClientDetail } from './verticals/client-demographics';
import { CarePlanList, CarePlanDetail, TaskList, CreateCarePlanPage } from './verticals/care-plans';
import { EVVRecordList, EVVRecordDetail } from './verticals/time-tracking-evv';
import { InvoiceList, InvoiceDetail } from './verticals/billing-invoicing';
import { PayRunList, PayRunDetail } from './verticals/payroll-processing';
import { OpenShiftList, OpenShiftDetail } from './verticals/shift-matching';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ShowcaseRoutes() {
  return (
    <Routes>
      {/* In showcase mode, all routes are accessible without authentication */}
      <Route
        path="/"
        element={
          <AppShell>
            <Dashboard />
          </AppShell>
        }
      />
      <Route
        path="/clients"
        element={
          <AppShell>
            <ClientList />
          </AppShell>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <AppShell>
            <ClientDetail />
          </AppShell>
        }
      />
      <Route
        path="/caregivers/*"
        element={
          <AppShell>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900">Caregivers Module</h2>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          </AppShell>
        }
      />
      <Route
        path="/shift-matching"
        element={
          <AppShell>
            <OpenShiftList />
          </AppShell>
        }
      />
      <Route
        path="/shift-matching/:id"
        element={
          <AppShell>
            <OpenShiftDetail />
          </AppShell>
        }
      />
      <Route
        path="/care-plans"
        element={
          <AppShell>
            <CarePlanList />
          </AppShell>
        }
      />
      <Route
        path="/care-plans/new"
        element={
          <AppShell>
            <CreateCarePlanPage />
          </AppShell>
        }
      />
      <Route
        path="/care-plans/:id"
        element={
          <AppShell>
            <CarePlanDetail />
          </AppShell>
        }
      />
      <Route
        path="/tasks"
        element={
          <AppShell>
            <TaskList />
          </AppShell>
        }
      />
      <Route
        path="/time-tracking"
        element={
          <AppShell>
            <EVVRecordList />
          </AppShell>
        }
      />
      <Route
        path="/time-tracking/:id"
        element={
          <AppShell>
            <EVVRecordDetail />
          </AppShell>
        }
      />
      <Route
        path="/billing"
        element={
          <AppShell>
            <InvoiceList />
          </AppShell>
        }
      />
      <Route
        path="/billing/:id"
        element={
          <AppShell>
            <InvoiceDetail />
          </AppShell>
        }
      />
      <Route
        path="/payroll"
        element={
          <AppShell>
            <PayRunList />
          </AppShell>
        }
      />
      <Route
        path="/payroll/runs/:id"
        element={
          <AppShell>
            <PayRunDetail />
          </AppShell>
        }
      />
      <Route
        path="/admin"
        element={
          <AppShell>
            <AdminDashboard />
          </AppShell>
        }
      />
      <Route
        path="/settings/*"
        element={
          <AppShell>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          </AppShell>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function ShowcaseApp() {
  const config = getApiProviderConfigFromEnv();

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProviderProvider config={config}>
        <BrowserRouter>
          <ShowcaseControls />
          <ShowcaseRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </ApiProviderProvider>
    </QueryClientProvider>
  );
}

export default ShowcaseApp;
