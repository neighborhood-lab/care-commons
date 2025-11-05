/**
 * Scenario Context and Provider
 *
 * Manages the state and flow of narrative-driven scenarios
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Scenario } from '../types';

interface ScenarioContextValue {
  currentScenario: Scenario | null;
  currentStep: number;
  isActive: boolean;
  startScenario: (scenario: Scenario) => void;
  nextStep: (actionId?: string) => void;
  previousStep: () => void;
  exitScenario: () => void;
  restartScenario: () => void;
  progress: number; // 0-1
  timeElapsed: number; // seconds
}

const ScenarioContext = createContext<ScenarioContextValue | undefined>(undefined);

export const useScenario = () => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};

interface ScenarioProviderProps {
  children: React.ReactNode;
}

export const ScenarioProvider: React.FC<ScenarioProviderProps> = ({ children }) => {
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const progress = currentScenario
    ? (currentStep + 1) / currentScenario.steps.length
    : 0;

  const startScenario = useCallback((scenario: Scenario) => {
    setCurrentScenario(scenario);
    setCurrentStep(0);
    setIsActive(true);
    setStartTime(Date.now());
    setTimeElapsed(0);
  }, []);

  const completeScenario = useCallback(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    setTimeElapsed(duration);

    // Could track completion analytics here
    console.log('Scenario completed:', {
      scenarioId: currentScenario?.id,
      duration,
      stepsCompleted: currentStep + 1,
    });

    setIsActive(false);
    // Keep scenario data for completion screen
    // setCurrentScenario(null);
    // setCurrentStep(0);
  }, [currentScenario, currentStep, startTime]);

  const nextStep = useCallback((actionId?: string) => {
    if (!currentScenario) return;

    const step = currentScenario.steps[currentStep];

    // If step requires specific action, validate it
    if (step?.nextOnAction && actionId !== step.nextOnAction) {
      console.warn('Wrong action selected');
      return;
    }

    // Validate if step has validation
    if (step?.validation && !step.validation()) {
      console.warn('Step validation failed');
      return;
    }

    // Move to next step or complete scenario
    if (currentStep < currentScenario.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeScenario();
    }
  }, [currentScenario, currentStep, completeScenario]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const exitScenario = useCallback(() => {
    setIsActive(false);
    setCurrentScenario(null);
    setCurrentStep(0);
    setTimeElapsed(0);
  }, []);

  const restartScenario = useCallback(() => {
    if (currentScenario) {
      setCurrentStep(0);
      setIsActive(true);
      setStartTime(Date.now());
      setTimeElapsed(0);
    }
  }, [currentScenario]);

  const value: ScenarioContextValue = {
    currentScenario,
    currentStep,
    isActive,
    startScenario,
    nextStep,
    previousStep,
    exitScenario,
    restartScenario,
    progress,
    timeElapsed,
  };

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
};
