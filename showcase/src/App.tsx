import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DataProviderContextProvider } from '@/core/providers/context';
import { RoleProvider } from './contexts/RoleContext';
import { createMockProvider } from './providers/mock-provider';
import { seedData } from './data/seed-data';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientDemographicsPage } from './pages/ClientDemographicsPage';
import { CarePlansPage } from './pages/CarePlansPage';
import { TaskManagementPage } from './pages/TaskManagementPage';
import { CaregiverManagementPage } from './pages/CaregiverManagementPage';
import { ShiftMatchingPage } from './pages/ShiftMatchingPage';
import { BillingPage } from './pages/BillingPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create mock data provider
const mockProvider = createMockProvider(seedData);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderContextProvider provider={mockProvider}>
        <RoleProvider defaultRole="coordinator">
          <BrowserRouter basename="/care-commons">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientDemographicsPage />} />
              <Route path="/care-plans" element={<CarePlansPage />} />
              <Route path="/tasks" element={<TaskManagementPage />} />
              <Route path="/caregivers" element={<CaregiverManagementPage />} />
              <Route path="/shifts" element={<ShiftMatchingPage />} />
              <Route path="/billing" element={<BillingPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </RoleProvider>
      </DataProviderContextProvider>
    </QueryClientProvider>
  );
};
