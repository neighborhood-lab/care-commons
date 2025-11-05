/**
 * Tour Context and Provider
 *
 * Manages the state and flow of interactive tours
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Tour, TourStep } from '../types';

interface TourContextValue {
  currentTour: Tour | null;
  currentStep: number;
  isActive: boolean;
  startTour: (tour: Tour) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  isPaused: boolean;
  progress: number; // 0-1
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tourStartTime, setTourStartTime] = useState<number>(0);

  const progress = currentTour
    ? (currentStep + 1) / currentTour.steps.length
    : 0;

  const startTour = useCallback((tour: Tour) => {
    setCurrentTour(tour);
    setCurrentStep(0);
    setIsActive(true);
    setIsPaused(false);
    setTourStartTime(Date.now());
  }, []);

  const nextStep = useCallback(() => {
    if (!currentTour) return;

    const step = currentTour.steps[currentStep];

    // Perform step action if defined
    if (step?.action) {
      step.action();
    }

    // Validate if interactive step
    if (step?.isInteractive && step?.validation) {
      if (!step.validation()) {
        // Show error or hint - could add toast notification here
        console.warn('Step validation failed');
        return;
      }
    }

    // Move to next step or complete tour
    if (currentStep < currentTour.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentTour, currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    if (currentTour?.onComplete) {
      currentTour.onComplete();
    }
    setIsActive(false);
    setCurrentTour(null);
    setCurrentStep(0);
  }, [currentTour]);

  const pauseTour = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTour = useCallback(() => {
    setIsPaused(false);
  }, []);

  const completeTour = useCallback(() => {
    const duration = Date.now() - tourStartTime;

    if (currentTour?.onComplete) {
      currentTour.onComplete();
    }

    // Could track completion analytics here
    console.log('Tour completed:', {
      tourId: currentTour?.id,
      duration,
      stepsCompleted: currentStep + 1,
    });

    setIsActive(false);
    setCurrentTour(null);
    setCurrentStep(0);
  }, [currentTour, currentStep, tourStartTime]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
          nextStep();
          break;
        case 'ArrowLeft':
          previousStep();
          break;
        case ' ':
          e.preventDefault();
          pauseTour();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPaused, skipTour, nextStep, previousStep, pauseTour]);

  const value: TourContextValue = {
    currentTour,
    currentStep,
    isActive,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    pauseTour,
    resumeTour,
    isPaused,
    progress,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
