import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, DriveStep, Driver, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour-styles.css';
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

interface TourConfig {
  steps: DriveStep[];
  startPath: string;
}

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

// Tour configurations with their starting paths
const tours: Record<string, TourConfig> = {
  'coordinator-overview': {
    steps: coordinatorOverviewSteps,
    startPath: '/dashboard',
  },
  'create-visit': {
    steps: createVisitSteps,
    startPath: '/scheduling',
  },
  'caregiver-workflow': {
    steps: caregiverWorkflowSteps,
    startPath: '/mobile',
  },
  'family-portal': {
    steps: familyPortalSteps,
    startPath: '/family-portal',
  },
  'admin-dashboard': {
    steps: adminDashboardSteps,
    startPath: '/analytics',
  },
  'client-management': {
    steps: clientManagementSteps,
    startPath: '/clients',
  },
  'care-plan': {
    steps: carePlanSteps,
    startPath: '/care-plans',
  },
  'billing': {
    steps: billingSteps,
    startPath: '/billing',
  },
  'shift-matching': {
    steps: shiftMatchingSteps,
    startPath: '/shifts',
  },
  'payroll': {
    steps: payrollSteps,
    startPath: '/payroll',
  },
};

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const driverInstance = useRef<Driver | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pendingTour = useRef<string | null>(null);

  // Clean up driver instance on unmount
  useEffect(() => {
    return () => {
      if (driverInstance.current) {
        driverInstance.current.destroy();
      }
    };
  }, []);

  // Start pending tour after navigation
  useEffect(() => {
    if (pendingTour.current) {
      const tourId = pendingTour.current;
      const tour = tours[tourId];

      // Check if we're on the correct page
      if (tour && location.pathname === tour.startPath) {
        pendingTour.current = null;
        // Small delay to ensure DOM is ready
        const timeout = setTimeout(() => {
          launchTour(tourId);
        }, 300);
        return () => clearTimeout(timeout);
      }
    }
  }, [location.pathname]);

  const stopTour = useCallback(() => {
    if (driverInstance.current) {
      driverInstance.current.destroy();
      driverInstance.current = null;
    }
    setCurrentTour(null);
    pendingTour.current = null;
  }, []);

  const launchTour = useCallback((tourId: string) => {
    const tour = tours[tourId];
    if (!tour) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    // Stop any existing tour
    if (driverInstance.current) {
      driverInstance.current.destroy();
      driverInstance.current = null;
    }

    // Create driver configuration with enhanced styling
    const driverConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tour.steps,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.7,
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'folkcare-tour-popover',
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

  const startTour = useCallback((tourId: string) => {
    const tour = tours[tourId];
    if (!tour) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    // Stop any existing tour
    stopTour();

    // Check if we need to navigate to the tour's start page
    if (location.pathname !== tour.startPath) {
      pendingTour.current = tourId;
      navigate(tour.startPath);
    } else {
      // Already on the correct page, start immediately
      // Small delay to ensure any modals/overlays are closed
      setTimeout(() => {
        launchTour(tourId);
      }, 100);
    }
  }, [location.pathname, navigate, stopTour, launchTour]);

  return (
    <TourContext.Provider value={{ startTour, stopTour, currentTour }}>
      {children}
    </TourContext.Provider>
  );
}
