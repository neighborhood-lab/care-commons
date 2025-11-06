/**
 * Family Notifications Hooks
 *
 * React Query hooks for family notification management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UUID, NotificationPreferences } from '@care-commons/family-engagement';
import { familyPortalApi } from '../services';

/**
 * Hook to get unread notifications
 */
export function useUnreadNotifications(familyMemberId: UUID | null) {
  return useQuery({
    queryKey: ['notifications', 'unread', familyMemberId],
    queryFn: () => familyPortalApi.getUnreadNotifications(familyMemberId!),
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: UUID) => familyPortalApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['familyDashboard'] });
    },
  });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences(familyMemberId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      familyPortalApi.updateNotificationPreferences(familyMemberId, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMember', familyMemberId] });
    },
  });
}
