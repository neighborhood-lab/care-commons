/**
 * Hook for fetching and managing notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../api';
import {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  NotificationFilters,
} from '../../types/notification';

const NOTIFICATIONS_QUERY_KEY = 'notifications';
const UNREAD_COUNT_QUERY_KEY = 'notifications-unread-count';

/**
 * Fetch notifications with filters and pagination
 */
export function useNotifications(filters?: NotificationFilters) {
  const api = useApiClient();

  return useQuery<NotificationListResponse>({
    queryKey: [NOTIFICATIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
      if (filters?.type) params.append('type', filters.type);

      const queryString = params.toString();
      const url = `/api/notifications${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<{ success: boolean; data: NotificationListResponse }>(url);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Fetch unread notification count
 */
export function useUnreadCount() {
  const api = useApiClient();

  return useQuery<number>({
    queryKey: [UNREAD_COUNT_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: UnreadCountResponse }>(
        '/api/notifications/unread-count'
      );
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Mark a notification as read
 */
export function useMarkAsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch<{ success: boolean; data: Notification }>(
        `/api/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<{ success: boolean; data: { count: number } }>(
        '/api/notifications/read-all'
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete<{ success: boolean; data: { deleted: boolean } }>(
        `/api/notifications/${notificationId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
}
