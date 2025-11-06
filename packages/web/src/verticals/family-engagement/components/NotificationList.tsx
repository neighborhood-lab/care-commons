/**
 * Notification List Component
 *
 * Display list of notifications with read/unread states
 */

import React from 'react';
import type { Notification } from '@care-commons/family-engagement';
import { useMarkNotificationAsRead } from '../hooks';

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
}

const priorityColors: Record<string, string> = {
  LOW: 'border-l-gray-400',
  NORMAL: 'border-l-blue-500',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-600',
};

const categoryIcons: Record<string, string> = {
  VISIT: '📅',
  CARE_PLAN: '📋',
  INCIDENT: '⚠️',
  APPOINTMENT: '🏥',
  MESSAGE: '💬',
  REMINDER: '🔔',
  SYSTEM: 'ℹ️',
};

export const NotificationList: React.FC<NotificationListProps> = ({ notifications, loading }) => {
  const markAsRead = useMarkNotificationAsRead();

  const handleNotificationClick = (notification: Notification) => {
    if (notification.deliveryStatus !== 'READ') {
      markAsRead.mutate(notification.id);
    }
    // Navigate to actionUrl if provided
    if (notification.actionUrl) {
      window.location.assign(notification.actionUrl);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg border-l-4 border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-4xl">🔔</p>
        <p className="mt-2 text-gray-600">No notifications</p>
        <p className="mt-1 text-sm text-gray-500">
          You'll receive notifications about important care updates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const isUnread = notification.deliveryStatus !== 'READ';
        const icon = categoryIcons[notification.category] || '•';
        const borderColor = priorityColors[notification.priority] || priorityColors.NORMAL;
        const timestamp = new Date(notification.sentAt || notification.createdAt).toLocaleString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }
        );

        return (
          <button
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`w-full text-left rounded-lg border-l-4 ${borderColor} bg-white p-4 shadow-sm hover:shadow-md transition-all ${
              isUnread ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl ${
                    isUnread ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  {icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-sm font-semibold ${
                      isUnread ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {notification.title}
                    {isUnread && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{timestamp}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                {notification.actionLabel && (
                  <span className="mt-2 inline-block text-sm font-medium text-blue-600">
                    {notification.actionLabel} →
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
