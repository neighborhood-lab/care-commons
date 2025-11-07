/**
 * Showcase Router
 *
 * Main router for the enhanced showcase experience
 */

import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { EnhancedLandingPage, ScenarioLibraryPage } from './pages';
import { WelcomeModal } from './components/onboarding/WelcomeModal';
import { EnhancedRoleSelector } from './components/onboarding/EnhancedRoleSelector';
import { ComparisonTable } from './components/visual/ComparisonTable';
import { TourProvider, TourOverlay } from './tours';
import { TourButton } from './components/tours/TourButton';
import { ScenarioProvider, ScenarioContainer } from './scenarios';
import { ScenarioButton } from './components/scenarios/ScenarioButton';
import { PersonaRole } from './types';
import { AppShell } from '../app/components';
import { Dashboard, NotFound, AdminDashboard } from '../app/pages';
import { ClientList, ClientDetail } from '../verticals/client-demographics';
import { CarePlanList, CarePlanDetail, TaskList, CreateCarePlanPage } from '../verticals/care-plans';
import { EVVRecordList, EVVRecordDetail } from '../verticals/time-tracking-evv';
import { InvoiceList, InvoiceDetail } from '../verticals/billing-invoicing';
import { PayRunList, PayRunDetail } from '../verticals/payroll-processing';
import { OpenShiftList, OpenShiftDetail } from '../verticals/shift-matching';

const CURRENT_ROLE_KEY = 'showcase-current-role';

const isValidRole = (role: string): role is PersonaRole => {
  return ['admin', 'coordinator', 'caregiver', 'patient'].includes(role);
};

export const ShowcaseRouter: React.FC = () => {
  const navigate = useNavigate();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [currentRole, setCurrentRole] = useState<PersonaRole | undefined>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(CURRENT_ROLE_KEY);
      if (stored && isValidRole(stored)) {
        return stored;
      }
    }
  });

  const handleRoleSelect = (roleId: string) => {
    if (isValidRole(roleId)) {
      setCurrentRole(roleId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CURRENT_ROLE_KEY, roleId);
      }
    }
    setShowRoleSelector(false);
    navigate('/dashboard').catch(() => {
      // Navigation error handling - silently fail as navigation is not critical
    });
  };

  const handleStartTour = () => {
    setShowRoleSelector(true);
  };

  return (
    <TourProvider>
      <ScenarioProvider>
        <Routes>
          {/* Landing Page */}
          <Route
            path="/"
            element={
              <EnhancedLandingPage
                onStartTour={handleStartTour}
              />
            }
          />

          {/* Scenario Library */}
          <Route
            path="/scenarios"
            element={<ScenarioLibraryPage />}
          />

          {/* Comparison Page */}
          <Route
            path="/comparison"
            element={
              <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4">
                  <ComparisonTable />
                </div>
              </div>
            }
          />

        {/* App Routes */}
        <Route
          path="/dashboard"
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

        {/* Welcome Modal */}
        <WelcomeModal onComplete={(role) => role && handleRoleSelect(role)} />

        {/* Enhanced Role Selector */}
        <EnhancedRoleSelector
          isOpen={showRoleSelector}
          onClose={() => setShowRoleSelector(false)}
          onSelectRole={handleRoleSelect}
          currentRole={currentRole}
        />

        {/* Tour Overlay */}
        <TourOverlay />

        {/* Scenario Container */}
        <ScenarioContainer />

        {/* Tour FAB Button - Only show after role selected */}
        {currentRole && <TourButton currentRole={currentRole} />}

        {/* Scenario FAB Button - Only show after role selected */}
        {currentRole && <ScenarioButton />}
      </ScenarioProvider>
    </TourProvider>
  );
};
