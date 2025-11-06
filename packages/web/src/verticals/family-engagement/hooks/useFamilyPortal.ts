/**
 * Family Portal Hooks
 *
 * React Query hooks for family portal data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UUID } from '@care-commons/family-engagement';
import { familyPortalApi } from '../services';

/**
 * Hook to get family member profile
 */
export function useFamilyMemberProfile(familyMemberId: UUID | null) {
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
  return useQuery({
    queryKey: ['activityFeed', familyMemberId, limit],
    queryFn: () => familyPortalApi.getRecentActivity(familyMemberId!, limit),
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}
