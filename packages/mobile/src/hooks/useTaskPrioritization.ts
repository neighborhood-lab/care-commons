/**
 * useTaskPrioritization Hook
 *
 * React hook for fetching AI-powered task prioritization.
 * Analyzes patient condition and care plan to intelligently rank tasks.
 */

import { useState, useEffect, useCallback } from 'react';
import { getApiClient } from '../services/api-client';

/**
 * Prioritized task with urgency score
 */
export interface PrioritizedTask {
  taskId: string;
  taskName: string;
  taskCategory: string;
  taskDescription: string;
  scheduledTime?: string;
  estimatedDuration?: number;

  // AI-generated prioritization
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgencyScore: number; // 0-100
  priorityReason: string;
  recommendedTimeframe: string;

  // Context
  relatedGoals?: string[];
  safetyConsiderations?: string[];
}

/**
 * Task prioritization result
 */
export interface TaskPrioritizationResult {
  clientName: string;
  clientId: string;
  date: string;
  totalTasks: number;

  // Prioritized tasks (ordered by urgency)
  tasks: PrioritizedTask[];

  // Patient context summary
  patientConditionSummary: string;
  criticalAlerts?: string[];

  // Metadata
  analyzedAt: string;
  basedOnNotesCount: number;
  basedOnVitalsCount: number;
}

/**
 * Request parameters
 */
export interface PrioritizeTasksParams {
  caregiverId: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  visitId?: string;
}

/**
 * Hook return type
 */
interface UseTaskPrioritizationReturn {
  prioritization: TaskPrioritizationResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  prioritize: (params: PrioritizeTasksParams) => Promise<void>;
}

/**
 * Hook for task prioritization
 */
export function useTaskPrioritization(
  params?: PrioritizeTasksParams
): UseTaskPrioritizationReturn {
  const [prioritization, setPrioritization] = useState<TaskPrioritizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const prioritize = useCallback(async (prioritizeParams: PrioritizeTasksParams) => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = getApiClient();
      const response = await apiClient.post<{ success: boolean; data: TaskPrioritizationResult }>(
        '/care-plans/tasks/prioritize',
        prioritizeParams
      );

      if (response.data.success) {
        setPrioritization(response.data.data);
      } else {
        throw new Error('Failed to prioritize tasks');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to prioritize tasks';
      setError(errorMessage);
      console.error('Error prioritizing tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (params) {
      await prioritize(params);
    }
  }, [params, prioritize]);

  // Auto-fetch on mount if params provided
  useEffect(() => {
    if (params) {
      prioritize(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.caregiverId, params?.clientId, params?.date, params?.visitId, prioritize]);

  return {
    prioritization,
    loading,
    error,
    refresh,
    prioritize,
  };
}
