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
 */
export const useCalendarVisits = (startDate: Date, endDate: Date, branchIds?: string[]) => {
  const visitApi = useVisitApi();

  return useQuery({
    queryKey: ['visits', 'calendar', startDate.toISOString(), endDate.toISOString(), branchIds],
    queryFn: () => visitApi.getCalendarVisits(startDate, endDate, branchIds),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

/**
 * Hook to fetch caregiver availability for a specific date
 */
export const useCaregiverAvailability = (date: Date, branchIds?: string[]) => {
  const visitApi = useVisitApi();

  return useQuery({
    queryKey: ['visits', 'caregiver-availability', date.toISOString(), branchIds],
    queryFn: () => visitApi.getCaregiverAvailability(date, branchIds),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};
