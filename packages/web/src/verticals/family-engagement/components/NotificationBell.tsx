/**
 * Notification Bell Component
 *
 * Header notification icon with unread badge
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface NotificationBellProps {
  unreadCount: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount }) => {
  return (
    <Link
      to="/family-portal/notifications"
      className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <span className="text-2xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
