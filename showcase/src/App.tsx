import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DataProviderContextProvider } from '@/core/providers/context';
import { RoleProvider } from './contexts/RoleContext';
import { TourProvider } from './components/tours/TourProvider';
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
import { SchedulingPage } from './pages/SchedulingPage';
import { EVVPage } from './pages/EVVPage';
import { PayrollPage } from './pages/PayrollPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { QualityAssurancePage } from './pages/QualityAssurancePage';
import { FamilyPortalPage } from './pages/FamilyPortalPage';
import { ToursPage } from './pages/ToursPage';
import { VideosPage } from './pages/VideosPage';
import { StateDemoPage } from './pages/StateDemoPage';

// Mobile Pages
import { MobileHomePage } from './pages/mobile/MobileHomePage';
import { MobileVisitsPage } from './pages/mobile/MobileVisitsPage';
import { MobileTasksPage } from './pages/mobile/MobileTasksPage';
import { MobileProfilePage } from './pages/mobile/MobileProfilePage';
import { MobileClientsPage } from './pages/mobile/MobileClientsPage';
import { MobileCarePlansPage } from './pages/mobile/MobileCarePlansPage';

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
          <TourProvider>
            <BrowserRouter basename="/care-commons">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Desktop/Web Routes */}
                <Route path="/clients" element={<ClientDemographicsPage />} />
                <Route path="/care-plans" element={<CarePlansPage />} />
                <Route path="/tasks" element={<TaskManagementPage />} />
                <Route path="/caregivers" element={<CaregiverManagementPage />} />
                <Route path="/scheduling" element={<SchedulingPage />} />
                <Route path="/shifts" element={<ShiftMatchingPage />} />
                <Route path="/evv" element={<EVVPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/quality" element={<QualityAssurancePage />} />
                <Route path="/family-portal" element={<FamilyPortalPage />} />
                <Route path="/tours" element={<ToursPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/states" element={<StateDemoPage />} />

                {/* Mobile Routes */}
                <Route path="/mobile" element={<MobileHomePage />} />
                <Route path="/mobile/visits" element={<MobileVisitsPage />} />
                <Route path="/mobile/tasks" element={<MobileTasksPage />} />
                <Route path="/mobile/profile" element={<MobileProfilePage />} />
                <Route path="/mobile/clients" element={<MobileClientsPage />} />
                <Route path="/mobile/care-plans" element={<MobileCarePlansPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster position="top-right" />
          </TourProvider>
        </RoleProvider>
      </DataProviderContextProvider>
    </QueryClientProvider>
  );
};
