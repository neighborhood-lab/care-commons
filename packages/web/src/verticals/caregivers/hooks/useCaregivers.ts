/**
 * React hook for fetching caregivers
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';
import { createCaregiverApiService } from '../services/index.js';
import type { CaregiverSearchFilters } from '../types/index.js';

export const useCaregiverApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createCaregiverApiService(apiClient), [apiClient]);
};

export function useCaregivers(
  filters: CaregiverSearchFilters = {},
  page: number = 1,
  limit: number = 20
) {
  const caregiverApi = useCaregiverApi();

  return useQuery({
    queryKey: ['caregivers', filters, page, limit],
    queryFn: () => caregiverApi.searchCaregivers(filters, page, limit),
    staleTime: 30000, // 30 seconds
  });
}

export function useCaregiver(id: string | undefined) {
  const caregiverApi = useCaregiverApi();

  return useQuery({
    queryKey: ['caregiver', id],
    queryFn: () => caregiverApi.getCaregiverById(id!),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}
