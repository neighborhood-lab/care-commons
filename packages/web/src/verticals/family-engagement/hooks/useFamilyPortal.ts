/**
 * Family Portal Hooks
 *
 * React Query hooks for family portal data fetching
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';
import type { UUID } from '@care-commons/core/browser';
import { createFamilyPortalApiService } from '../services';

/**
 * Hook to get family portal API service
 */
export function useFamilyPortalApi() {
  const apiClient = useApiClient();
  return useMemo(() => createFamilyPortalApiService(apiClient), [apiClient]);
}

/**
 * Hook to get family member profile
 */
export function useFamilyMemberProfile(familyMemberId: UUID | null) {
  const familyPortalApi = useFamilyPortalApi();

  return useQuery({
    queryKey: ['familyMember', familyMemberId],
    queryFn: () => familyPortalApi.getFamilyMemberProfile(familyMemberId!),
    enabled: !!familyMemberId,
  });
}

/**
 * Hook to get family dashboard data
 */
export function useFamilyDashboard(familyMemberId: UUID | null) {
  const familyPortalApi = useFamilyPortalApi();

  return useQuery({
    queryKey: ['familyDashboard', familyMemberId],
    queryFn: () => familyPortalApi.getFamilyDashboard(familyMemberId!),
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}

/**
 * Hook to get recent activity feed
 */
export function useRecentActivity(familyMemberId: UUID | null, limit = 20) {
  const familyPortalApi = useFamilyPortalApi();

  return useQuery({
    queryKey: ['activityFeed', familyMemberId, limit],
    queryFn: () => familyPortalApi.getRecentActivity(familyMemberId!, limit),
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}
