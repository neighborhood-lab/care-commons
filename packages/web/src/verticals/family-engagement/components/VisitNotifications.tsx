/**
 * Visit Notifications Component
 *
 * Real-time toast notifications for visit events (check-in, check-out, etc.)
 */

import React, { useEffect, useRef } from 'react';
import { useUnreadNotifications } from '../hooks';
import { useAuth } from '@/core/hooks';
import type { UUID } from '@care-commons/core/browser';

interface VisitNotificationsProps {
  
}

/**
 * This component handles displaying toast notifications for visit events.
 * It polls for new notifications and displays them using the browser's
 * Notification API or could be integrated with a toast library.
 */
export const VisitNotifications: React.FC<VisitNotificationsProps> = ({}) => {
  const { user } = useAuth();
  const familyMemberId = user?.id as UUID | null;

  // Get unread notifications
  const { data: notifications } = useUnreadNotifications(familyMemberId);

  // Track which notifications we've already shown
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Filter for visit-related notifications that haven't been shown yet
    const newNotifications = notifications.filter(
      (notification) =>
        notification.category === 'VISIT' &&
        notification.deliveryStatus === 'SENT' &&
        !shownNotificationsRef.current.has(notification.id)
    );

    if (newNotifications.length === 0) return;

    // Show each new notification
    newNotifications.forEach((notification) => {
      // Mark as shown
      shownNotificationsRef.current.add(notification.id);

      // Determine icon based on notification content
      let icon = 'ℹ️';
      const message = notification.message.toLowerCase();

      if (message.includes('check') && message.includes('in')) {
        icon = '✅';
      } else if (message.includes('check') && message.includes('out')) {
        icon = '👋';
      } else if (message.includes('complete')) {
        icon = '✓';
      } else if (message.includes('start')) {
        icon = '🏁';
      } else if (message.includes('cancel')) {
        icon = '❌';
      }

      // For now, we'll use console.log as a placeholder
      // In a real implementation, this would integrate with react-hot-toast or similar
      console.log(`[NOTIFICATION] ${icon} ${notification.title}: ${notification.message}`);

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png', // Update with actual icon path
          tag: notification.id,
        });
      }

      // If react-hot-toast is available, you could do:
      // toast(notification.message, {
      //   icon: icon,
      //   duration: 5000,
      //   id: notification.id,
      // });
    });
  }, [notifications]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // This component doesn't render any UI
  return null;
};

/**
 * Helper function to initialize visit notifications in the app
 */
export const initializeVisitNotifications = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};
