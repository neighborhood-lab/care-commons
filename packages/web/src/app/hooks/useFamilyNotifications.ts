import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';

// Types from family-engagement vertical
interface Notification {
  id: string;
  familyMemberId: string;
  clientId: string;
  category: 'VISIT' | 'CARE_PLAN' | 'INCIDENT' | 'APPOINTMENT' | 'MESSAGE' | 'REMINDER' | 'SYSTEM';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: 'VISIT' | 'CARE_PLAN' | 'INCIDENT' | 'MESSAGE' | 'APPOINTMENT';
  relatedEntityId?: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'DISMISSED';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  dismissedAt?: string;
  emailSent: boolean;
  smsSent: boolean;
  pushSent: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  visitReminders: boolean;
  visitCompletedUpdates: boolean;
  careplanUpdates: boolean;
  incidentAlerts: boolean;
  appointmentReminders: boolean;
  messageNotifications: boolean;
  digestFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NONE';
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

/**
 * Hook for fetching unread notifications
 */
export function useUnreadNotifications(familyMemberId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['notifications', 'unread', familyMemberId],
    queryFn: async () => {
      const response = await api.get<Notification[]>(
        `/family-engagement/notifications/family-member/${familyMemberId}/unread`
      );
      return response.data;
    },
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook for fetching all notifications (paginated)
 */
export function useNotifications(familyMemberId: string, page = 1, limit = 20) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['notifications', familyMemberId, page, limit],
    queryFn: async () => {
      const response = await api.get<{ notifications: Notification[]; total: number }>(
        `/family-engagement/notifications/family-member/${familyMemberId}?page=${page}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!familyMemberId,
  });
}

/**
 * Hook for marking notification as read
 */
export function useMarkNotificationAsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/family-engagement/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['family-dashboard'] });
    },
  });
}

/**
 * Hook for dismissing notification
 */
export function useDismissNotification() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/family-engagement/notifications/${notificationId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['family-dashboard'] });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (familyMemberId: string) => {
      await api.post(`/family-engagement/notifications/family-member/${familyMemberId}/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['family-dashboard'] });
    },
  });
}

/**
 * Hook for fetching notification preferences
 */
export function useNotificationPreferences(familyMemberId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['notification-preferences', familyMemberId],
    queryFn: async () => {
      const response = await api.get<NotificationPreferences>(
        `/family-engagement/family-members/${familyMemberId}/notification-preferences`
      );
      return response.data;
    },
    enabled: !!familyMemberId,
  });
}

/**
 * Hook for updating notification preferences
 */
export function useUpdateNotificationPreferences() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyMemberId, preferences }: { familyMemberId: string; preferences: Partial<NotificationPreferences> }) => {
      const response = await api.patch(
        `/family-engagement/family-members/${familyMemberId}/notification-preferences`,
        preferences
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', variables.familyMemberId] });
    },
  });
}
