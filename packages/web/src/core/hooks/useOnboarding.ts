/**
 * useOnboarding Hook
 * 
 * Manages onboarding progress and go-live checklist state.
 * Provides methods to update steps, checklist items, and run auto-verification.
 */

import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './api.js';
import type {
  OnboardingProgress,
  OnboardingStepId,
  ChecklistItemStatus,
  GoLiveCategory,
} from '@care-commons/core';

interface CategorySummary {
  label: string;
  total: number;
  completed: number;
  percentage: number;
}

interface OnboardingApiResponse {
  success: boolean;
  data?: {
    progress: OnboardingProgress;
    categorySummary: Record<GoLiveCategory, CategorySummary>;
    message?: string;
  };
  error?: string;
}

interface OnboardingState {
  progress: OnboardingProgress | null;
  categorySummary: Record<GoLiveCategory, CategorySummary> | null;
  isLoading: boolean;
  error: string | null;
}

interface OnboardingActions {
  initialize: (stateCode: string) => Promise<void>;
  refresh: () => Promise<void>;
  updateStep: (stepId: OnboardingStepId, status: ChecklistItemStatus, metadata?: Record<string, unknown>) => Promise<void>;
  updateChecklistItem: (itemId: string, status: ChecklistItemStatus) => Promise<void>;
  runVerification: () => Promise<void>;
  approveGoLive: () => Promise<void>;
}

export function useOnboarding(): OnboardingState & OnboardingActions {
  const apiClient = useApiClient();
  
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [categorySummary, setCategorySummary] = useState<Record<GoLiveCategory, CategorySummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback((data: { progress: OnboardingProgress; categorySummary: Record<GoLiveCategory, CategorySummary> }) => {
    setProgress(data.progress);
    setCategorySummary(data.categorySummary);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<OnboardingApiResponse>('/api/onboarding');
      if (response.success && response.data !== undefined) {
        updateState(response.data);
      } else {
        // Onboarding not initialized - this is not necessarily an error
        setProgress(null);
        setCategorySummary(null);
      }
    } catch (err) {
      // 404 means not initialized, not an error
      const message = err instanceof Error ? err.message : 'Failed to load onboarding';
      if (!message.includes('404') && !message.includes('not initialized')) {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, updateState]);

  const initialize = useCallback(async (stateCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<OnboardingApiResponse>('/api/onboarding/initialize', { stateCode });
      if (response.success && response.data !== undefined) {
        updateState(response.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize onboarding';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, updateState]);

  const updateStep = useCallback(async (
    stepId: OnboardingStepId,
    status: ChecklistItemStatus,
    metadata?: Record<string, unknown>
  ) => {
    setError(null);
    try {
      const response = await apiClient.patch<OnboardingApiResponse>(`/api/onboarding/steps/${stepId}`, { status, metadata });
      if (response.success && response.data !== undefined) {
        updateState(response.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update step';
      setError(message);
      throw err;
    }
  }, [apiClient, updateState]);

  const updateChecklistItem = useCallback(async (itemId: string, status: ChecklistItemStatus) => {
    setError(null);
    try {
      const response = await apiClient.patch<OnboardingApiResponse>(`/api/onboarding/checklist/${itemId}`, { status });
      if (response.success && response.data !== undefined) {
        updateState(response.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update checklist item';
      setError(message);
      throw err;
    }
  }, [apiClient, updateState]);

  const runVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<OnboardingApiResponse>('/api/onboarding/verify');
      if (response.success && response.data !== undefined) {
        updateState(response.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run verification';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, updateState]);

  const approveGoLive = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<OnboardingApiResponse>('/api/onboarding/go-live');
      if (response.success && response.data !== undefined) {
        updateState(response.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve go-live';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, updateState]);

  // Load onboarding on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    progress,
    categorySummary,
    isLoading,
    error,
    initialize,
    refresh,
    updateStep,
    updateChecklistItem,
    runVerification,
    approveGoLive,
  };
}
