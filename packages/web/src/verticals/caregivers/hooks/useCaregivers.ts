/**
 * React hook for fetching caregivers
 */

import { useQuery } from '@tanstack/react-query';
import { createCaregiverApiService } from '../services/index.js';
import { createApiClient } from '@/core/services/index.js';
import type { CaregiverSearchFilters } from '../types/index.js';

// Create API client instance
const apiClient = createApiClient('', () => null);
const caregiverApi = createCaregiverApiService(apiClient);

export function useCaregivers(
  filters: CaregiverSearchFilters = {},
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['caregivers', filters, page, limit],
    queryFn: () => caregiverApi.searchCaregivers(filters, page, limit),
    staleTime: 30000, // 30 seconds
  });
}

export function useCaregiver(id: string | undefined) {
  return useQuery({
    queryKey: ['caregiver', id],
    queryFn: () => caregiverApi.getCaregiverById(id!),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}
