import React, { createContext, useContext, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import {
  coordinatorOverviewSteps,
  createVisitSteps,
  caregiverWorkflowSteps,
  familyPortalSteps,
  adminDashboardSteps
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

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [run, setRun] = useState(false);

  const tours = {
    'coordinator-overview': coordinatorOverviewSteps,
    'create-visit': createVisitSteps,
    'caregiver-workflow': caregiverWorkflowSteps,
    'family-portal': familyPortalSteps,
    'admin-dashboard': adminDashboardSteps
  };

  const startTour = (tourId: string) => {
    const tourSteps = tours[tourId as keyof typeof tours];
    if (tourSteps) {
      setSteps(tourSteps);
      setCurrentTour(tourId);
      setRun(true);
    }
  };

  const stopTour = () => {
    setRun(false);
    setCurrentTour(null);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour, currentTour }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            zIndex: 10000
          }
        }}
      />
    </TourContext.Provider>
  );
}
