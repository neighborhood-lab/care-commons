import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { driver, DriveStep, Driver, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  coordinatorOverviewSteps,
  createVisitSteps,
  caregiverWorkflowSteps,
  familyPortalSteps,
  adminDashboardSteps,
  clientManagementSteps,
  carePlanSteps,
  billingSteps,
  shiftMatchingSteps,
  payrollSteps
} from './tour-steps';

interface TourContextValue {
  startTour: (tourId: string) => void;
  stopTour: () => void;
  currentTour: string | null;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within TourProvider');
  return context;
}

const tours: Record<string, DriveStep[]> = {
  'coordinator-overview': coordinatorOverviewSteps,
  'create-visit': createVisitSteps,
  'caregiver-workflow': caregiverWorkflowSteps,
  'family-portal': familyPortalSteps,
  'admin-dashboard': adminDashboardSteps,
  'client-management': clientManagementSteps,
  'care-plan': carePlanSteps,
  'billing': billingSteps,
  'shift-matching': shiftMatchingSteps,
  'payroll': payrollSteps
};

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const driverInstance = useRef<Driver | null>(null);

  // Clean up driver instance on unmount
  useEffect(() => {
    return () => {
      if (driverInstance.current) {
        driverInstance.current.destroy();
      }
    };
  }, []);

  const stopTour = useCallback(() => {
    if (driverInstance.current) {
      driverInstance.current.destroy();
      driverInstance.current = null;
    }
    setCurrentTour(null);
  }, []);

  const startTour = useCallback((tourId: string) => {
    const tourSteps = tours[tourId];
    if (!tourSteps) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    // Stop any existing tour
    stopTour();

    // Create driver configuration
    const driverConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tourSteps,
      onDestroyStarted: () => {
        stopTour();
      },
      onDestroyed: () => {
        setCurrentTour(null);
      },
    };

    // Create and start the driver
    driverInstance.current = driver(driverConfig);
    setCurrentTour(tourId);
    driverInstance.current.drive();
  }, [stopTour]);

  return (
    <TourContext.Provider value={{ startTour, stopTour, currentTour }}>
      {children}
    </TourContext.Provider>
  );
}
