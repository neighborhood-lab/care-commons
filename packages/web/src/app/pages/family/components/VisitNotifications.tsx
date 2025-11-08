import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '@/services/api';

interface Notification {
  id: string;
  message: string;
  type: 'check_in' | 'check_out' | 'task_complete' | 'message' | 'general';
  read: boolean;
}

export const VisitNotifications: React.FC<{ clientId: string }> = ({
  clientId,
}) => {
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['family', 'notifications', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/notifications`),
    refetchInterval: 15000, // Check every 15 seconds
  });

  useEffect(() => {
    notifications?.forEach((notification) => {
      if (!notification.read) {
        // Show toast notification
        toast(notification.message, {
          icon:
            notification.type === 'check_in'
              ? '✅'
              : notification.type === 'check_out'
              ? '👋'
              : 'ℹ️',
          duration: 5000,
        });

        // Mark as read
        api.patch(`/api/family/notifications/${notification.id}/read`);
      }
    });
  }, [notifications]);

  return null; // This is a notification handler, no UI
};
