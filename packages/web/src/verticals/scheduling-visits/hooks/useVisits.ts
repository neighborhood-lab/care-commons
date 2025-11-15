import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';
import { createVisitApiService } from '../services/visit-api';
import type { VisitSearchFilters } from '../types';

export const useVisitApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createVisitApiService(apiClient), [apiClient]);
};

/**
 * Hook to fetch visits for the current user (caregiver)
 * within a date range
 */
export const useMyVisits = (startDate: Date, endDate: Date) => {
  const visitApi = useVisitApi();

  return useQuery({
    queryKey: ['visits', 'my-visits', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => visitApi.getMyVisits(startDate, endDate),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to fetch visits with filters
 */
export const useVisits = (filters?: VisitSearchFilters) => {
  const visitApi = useVisitApi();

  return useQuery({
    queryKey: ['visits', 'search', filters],
    queryFn: () => visitApi.getVisitsByFilters(filters ?? {}),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to fetch calendar visits within a date range
 * Used for coordinator calendar view
 *
 * Features:
 * - Automatic retry with exponential backoff for 429 errors (via API client)
 * - 60-second cache to reduce API calls on navigation
 * - Keeps previous data during refetches to prevent blank screens
 * - Smart retry logic that skips auth errors
 */
export const useCalendarVisits = (startDate: Date, endDate: Date, branchIds?: string[]) => {
  const visitApi = useVisitApi();

  return useQuery({
    queryKey: ['visits', 'calendar', startDate.toISOString(), endDate.toISOString(), branchIds],
    queryFn: () => visitApi.getCalendarVisits(startDate, endDate, branchIds),
    staleTime: 60 * 1000, // 60 seconds - reduce API calls on tab switches
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data longer
    retry: (failureCount, error) => {
      // Don't retry if it's a 403 or 401 (auth issues)
      if (
        typeof error === 'object' &&
        error != null &&
        'status' in error &&
        (error.status === 403 || error.status === 401)
      ) {
        return false;
      }
      // Retry up to 3 times for other errors
      // Note: 429 errors are already retried by the API client
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    // Keep previous data during refetch to prevent blank screen
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

/**
 * Hook to fetch caregiver availability for a specific date
 *
 * Features:
 * - Automatic retry with exponential backoff for 429 errors (via API client)
 * - 60-second cache to reduce API calls
 * - Keeps previous data during refetches
 * - Smart retry logic that skips auth errors
 */
export const useCaregiverAvailability = (date: Date, branchIds?: string[]) => {
  const visitApi = useVisitApi();

  return useQuery({
    queryKey: ['visits', 'caregiver-availability', date.toISOString(), branchIds],
    queryFn: () => visitApi.getCaregiverAvailability(date, branchIds),
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (
        typeof error === 'object' &&
        error != null &&
        'status' in error &&
        (error.status === 403 || error.status === 401)
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};
