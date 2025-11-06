/**
 * Family Notifications Hooks
 *
 * React Query hooks for family notification management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { UUID, NotificationPreferences } from '@care-commons/family-engagement';
import { useFamilyPortalApi } from './useFamilyPortal';

/**
 * Hook to get unread notifications
 */
export function useUnreadNotifications(familyMemberId: UUID | null) {
  const familyPortalApi = useFamilyPortalApi();

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
  const familyPortalApi = useFamilyPortalApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: UUID) => familyPortalApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notifications
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['familyDashboard'] });
    },
  });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences(familyMemberId: UUID) {
  const familyPortalApi = useFamilyPortalApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      familyPortalApi.updateNotificationPreferences(familyMemberId, preferences),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['familyMember', familyMemberId] });
      toast.success('Notification preferences updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notification preferences');
    },
  });
}
