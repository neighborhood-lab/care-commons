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
