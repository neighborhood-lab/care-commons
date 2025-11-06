/**
 * NotificationBell Component
 *
 * Bell icon with unread badge that opens the notification panel
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '../../hooks/notifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
